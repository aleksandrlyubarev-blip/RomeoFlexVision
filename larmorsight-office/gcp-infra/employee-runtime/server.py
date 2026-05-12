"""Плейсхолдер-рантайм AI-сотрудника LarmorSight для Cloud Run.

Это СКЕЛЕТ. Замените на реальный рантайм, который:
  - загружает employees/<name>/SKILL.md и общие references/ из бакета навыков
    (env LARMORSIGHT_SKILLS_BUCKET / LARMORSIGHT_SKILL_PATH);
  - читает ANTHROPIC_API_KEY (инъектится из Secret Manager);
  - выполняет задачи сотрудника и отдаёт результат по HTTP.

Cloud Run направляет трафик на порт из переменной окружения PORT.
"""
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.environ.get("PORT", "8080"))
EMPLOYEE = os.environ.get("LARMORSIGHT_EMPLOYEE", "unknown")
SKILLS_BUCKET = os.environ.get("LARMORSIGHT_SKILLS_BUCKET", "")
SKILL_PATH = os.environ.get("LARMORSIGHT_SKILL_PATH", "")


class Handler(BaseHTTPRequestHandler):
    def _respond(self) -> None:
        body = (
            f"LarmorSight employee '{EMPLOYEE}' — placeholder runtime.\n"
            f"skills bucket: {SKILLS_BUCKET or '(unset)'}\n"
            f"skill path:    {SKILL_PATH or '(unset)'}\n"
            "Replace gcp-infra/employee-runtime/ with a real runtime.\n"
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - http.server API
        self._respond()

    def do_POST(self) -> None:  # noqa: N802 - http.server API
        self._respond()

    def log_message(self, *_args) -> None:  # тише в логах
        pass


if __name__ == "__main__":
    print(f"LarmorSight employee '{EMPLOYEE}' listening on :{PORT}")
    HTTPServer(("", PORT), Handler).serve_forever()
