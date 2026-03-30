import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    deleteMyProgress(): Promise<void>;
    loadProgress(): Promise<string | null>;
    saveProgress(progressDataString: string): Promise<void>;
}
