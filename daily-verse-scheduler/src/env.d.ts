/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly PUBLIC_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
