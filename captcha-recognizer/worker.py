#!/usr/bin/env python3
"""Datalex CAPTCHA local recognizer worker (Galstyan redesign, Stage G).

Isolated CPU worker for the opt-in automatic recognition mode. Protocol:
  stdin : one JSON object per line  {"id": "<req-id>", "image": "<base64 png/jpeg>"}
  stdout: one JSON object per line  {"id": "...", "kind": "candidate", "text": "..."}
                                     {"id": "...", "kind": "unavailable", "reason": "..."}
  startup line: {"event": "ready"} once the model is loaded, or
                {"event": "fatal", "reason": "..."} if the model cannot load.

The worker NEVER receives PHPSESSID cookies, URLs, or case data — only
bounded image bytes. It cannot reach the network. stderr is diagnostic only
(never logged by the host with payload data).

Run: venv/Scripts/python.exe worker.py          (long-lived, line protocol)
     venv/Scripts/python.exe worker.py --selftest   (generate fixture, verify, exit 0/1)
"""

import base64
import io
import json
import sys

MAX_IMAGE_BYTES = 256 * 1024


def load_ocr():
    import ddddocr  # deferred — startup error must produce {"event": "fatal"}

    return ddddocr.DdddOcr(show_ad=False)


def recognize(ocr, image_b64: str) -> str:
    raw = base64.b64decode(image_b64, validate=False)
    if len(raw) == 0:
        raise ValueError("empty image")
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("image exceeds 256 KiB cap")
    text = ocr.classification(raw)
    return (text or "").strip()


def selftest() -> int:
    """Generate a synthetic text image with Pillow, run it through the real
    model + protocol path, and print the candidate. Exit 0 = worker viable."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print(json.dumps({"event": "fatal", "reason": "pillow not installed"}))
        return 1

    img = Image.new("RGB", (160, 48), color=(245, 245, 245))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default(size=28)
    except TypeError:
        font = ImageFont.load_default()
    draw.text((12, 8), "1234", fill=(20, 20, 20), font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    try:
        ocr = load_ocr()
    except Exception as e:  # noqa: BLE001 — report exact reason to host
        print(json.dumps({"event": "fatal", "reason": f"model load failed: {e}"}))
        return 1

    candidate = recognize(ocr, base64.b64encode(buf.getvalue()).decode("ascii"))
    print(json.dumps({
        "event": "selftest",
        "candidate": candidate,
        "note": "uncalibrated — digit fixture only proves the pipeline runs",
    }))
    return 0


def serve() -> int:
    try:
        ocr = load_ocr()
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"event": "fatal", "reason": f"model load failed: {e}"}), flush=True)
        return 1
    print(json.dumps({"event": "ready"}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            req_id = str(req.get("id", ""))
            text = recognize(ocr, str(req.get("image", "")))
            if text:
                print(json.dumps({"id": req_id, "kind": "candidate", "text": text}), flush=True)
            else:
                print(json.dumps({"id": req_id, "kind": "manual-required",
                                  "reason": "empty recognition result"}), flush=True)
        except Exception as e:  # noqa: BLE001 — one bad request must not kill the worker
            print(json.dumps({"id": req_id, "kind": "unavailable",
                              "reason": f"recognition error: {e}"}), flush=True)
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        sys.exit(selftest())
    sys.exit(serve())
