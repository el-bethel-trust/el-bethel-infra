{
  description = "El-Bethel Development";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android-nixpkgs = {
      url = "github:tadfisher/android-nixpkgs";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, android-nixpkgs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          system = system;
          config.allowUnfree = true;
          config.android_sdk.accept_license = true;
        };

        android = android-nixpkgs.sdk.${system};

        androidSdk = android (sdkPkgs:
          with sdkPkgs; [
            cmdline-tools-latest
            build-tools-34-0-0
            build-tools-35-0-0
            platform-tools
            platforms-android-34
            platforms-android-35
          ]);

        packages = with pkgs; [ androidSdk android-tools nodejs pnpm jdk ];
      in {
        devShell = pkgs.mkShell {
          name = "El-Bethel";

          buildInputs = packages;

          ANDROID_HOME = "${androidSdk}/share/android-sdk";
        };
      });
}
