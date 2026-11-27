{
  description = "xoxd-ai/bazel-registry development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    # gf-reapi-credhelper: the one way a developer or a job logs in to GF (--config=gf, TIN-8469).
    gloriousflywheel.url = "github:xoxd-ai/GloriousFlywheel";
  };

  outputs =
    { self, nixpkgs, flake-utils, gloriousflywheel }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # GF login for --config=gf
            gloriousflywheel.packages.${system}.gf-reapi-credhelper

            # Bazel reads .bazelversion through bazelisk; just is the entrypoint.
            bazelisk
            just
            git
            jq

            # The scripts/*.mjs checks outside Bazel and the release verifiers.
            nodejs_22
            python3
          ];
        };
      }
    );
}
