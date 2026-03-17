#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
import venv
from pathlib import Path


OPTIONAL_MODULES = ["librosa", "numpy"]


def run(command, env=None):
    try:
      completed = subprocess.run(
          command,
          capture_output=True,
          text=True,
          env=env,
          timeout=120,
          check=False,
      )
      return {
          "command": command,
          "returncode": completed.returncode,
          "stdout": completed.stdout.strip(),
          "stderr": completed.stderr.strip(),
      }
    except Exception as error:
      return {
          "command": command,
          "returncode": 1,
          "stdout": "",
          "stderr": str(error),
      }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--venv", required=True)
    parser.add_argument("--requirements", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--install", action="store_true")
    args = parser.parse_args()

    venv_dir = Path(args.venv)
    venv_dir.parent.mkdir(parents=True, exist_ok=True)

    builder = venv.EnvBuilder(with_pip=True)
    builder.create(venv_dir)

    if sys.platform == "win32":
        python_executable = venv_dir / "Scripts" / "python.exe"
    else:
        python_executable = venv_dir / "bin" / "python"

    report = {
        "created": True,
        "python_executable": str(python_executable),
        "requirements": args.requirements,
        "install_attempted": args.install,
        "module_status": {},
        "pip_upgrade": None,
        "pip_install": None,
        "warnings": [],
    }

    if args.install and Path(args.requirements).exists():
        pip_env = os.environ.copy()
        pip_env["PIP_DISABLE_PIP_VERSION_CHECK"] = "1"
        pip_env["PIP_DEFAULT_TIMEOUT"] = "5"
        report["pip_upgrade"] = run([str(python_executable), "-m", "pip", "install", "--upgrade", "pip"], pip_env)
        report["pip_install"] = run([str(python_executable), "-m", "pip", "install", "-r", args.requirements], pip_env)
        if report["pip_install"]["returncode"] != 0:
            report["warnings"].append("Optional dependency installation did not complete successfully.")

    for module_name in OPTIONAL_MODULES:
        command = [
            str(python_executable),
            "-c",
            f"import importlib.util; print('yes' if importlib.util.find_spec('{module_name}') else 'no')",
        ]
        result = run(command)
        report["module_status"][module_name] = result["stdout"] == "yes"

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
