
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MMOPlayerPrefs')
export class MMOPlayerPrefs {

    private static RememberMeKey: string = "TD4-MMO-RememberMe";
    private static EmailKey: string = "TD4-MMO-RememberEmail";
    private static PasswordKey: string = "TD4-MMO-RememberPassword";

    public static set email(value: string | null) {
        localStorage.setItem(this.EmailKey, value || "");
    }

    public static get email(): string | null {
        return localStorage.getItem(this.EmailKey) || null;
    }

    public static set password(value: string | null) {
        localStorage.setItem(this.PasswordKey, value || "");
    }

    public static get password(): string | null {
        return localStorage.getItem(this.PasswordKey) || "";
    }

    public static get rememberMe(): boolean {
        return localStorage.getItem(this.RememberMeKey) == "true" || false;
    }

    public static set rememberMe(value: boolean) {
        localStorage.setItem(this.RememberMeKey, value ? "true" : "false");
    }

    public static get accountExists(): boolean {
        return this.email != null && this.password != null;
    }

    public static Clear() {
        this.rememberMe = false;
        this.email = "";
        this.password = "";
    }
}
