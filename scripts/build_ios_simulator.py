"""Build an unsigned simulator .app without Apple Developer credentials."""
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]


def run(args, cwd=ROOT):
    subprocess.run(args, cwd=cwd, check=True)


def main():
    try:
        run(["xcodebuild", "-version"])
    except (FileNotFoundError, subprocess.CalledProcessError):
        sys.exit("Full Xcode is required. Install Xcode and select its developer directory before building.")
    if not (ROOT / "node_modules" / "expo").exists():
        sys.exit("Dependencies are missing. Run npm install first.")
    if not shutil.which("pod"):
        sys.exit("CocoaPods is required. Install it before building.")
    run(["npm", "run", "check"])
    run(["npx", "expo", "install", "--check"])
    run(["npx", "expo", "prebuild", "--platform", "ios", "--no-install"])
    run(["pod", "install"], cwd=ROOT / "ios")
    workspaces = list((ROOT / "ios").glob("*.xcworkspace"))
    projects = list((ROOT / "ios").glob("*.xcodeproj"))
    if len(workspaces) != 1 or len(projects) != 1:
        sys.exit("Expected one generated app workspace and project. Inspect ios/ before continuing.")
    run([
        "xcodebuild", "-workspace", str(workspaces[0]), "-scheme", projects[0].stem,
        "-configuration", "Release", "-sdk", "iphonesimulator",
        "-destination", "generic/platform=iOS Simulator",
        "-derivedDataPath", str(ROOT / "build" / "ios"),
        "CODE_SIGNING_ALLOWED=NO", "build",
    ])
    apps = list((ROOT / "build" / "ios" / "Build" / "Products" / "Release-iphonesimulator").glob("*.app"))
    if len(apps) != 1:
        sys.exit("Expected one simulator app product; inspect the Xcode build output.")
    target = ROOT / "artifacts" / "communicate-together-ios-simulator.tar.gz"
    target.parent.mkdir(exist_ok=True)
    with tarfile.open(target, "w:gz") as archive:
        archive.add(apps[0], arcname=apps[0].name)
    print(f"Built iOS simulator app: {target}")


if __name__ == "__main__":
    main()
