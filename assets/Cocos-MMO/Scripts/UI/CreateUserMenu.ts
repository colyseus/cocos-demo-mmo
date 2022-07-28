
import { _decorator, Component, Node, Label, EditBox, Button, Toggle } from 'cc';
import { MMOManager } from '../Managers/MMOManager';
import { MMOPlayerPrefs } from '../MMOPlayerPrefs';
import { RequestResponse } from '../Models/RequestResponse';
const { ccclass, property } = _decorator;

@ccclass('CreateUserMenu')
export class CreateUserMenu extends Component {
   
    @property({type:Node})
    private optionsView: Node = null;
    @property({type:Node})
    private loginView: Node = null;
    @property({type:Node})
    private signUpView: Node = null;
    @property({type:Node})
    private backBtn: Node = null;

    @property({type:Label})
    private signUpErrorMsg: Label = null;
    @property({type:EditBox})
    private usernameInput: EditBox = null;
    @property({type:EditBox})
    private emailInput: EditBox = null;
    @property({type:EditBox})
    private passwordInput: EditBox = null;
    @property({type:Button})
    private signUpBtn: Button = null;
    @property({type:Node})
    private signUpSpinner: Node = null;

    @property({type:Label})
    private logInErrorMsg: Label = null;
    @property({type:EditBox})
    private logInEmailInput: EditBox = null;
    @property({type:EditBox})
    private logInPasswordInput: EditBox = null;
    @property({type:Button})
    private logInBtn: Button = null;
    @property({type:Toggle})
    private rememberMe: Toggle = null;    
    @property({type:Node})
    private logInSpinner: Node = null;

    public consumeSeatReservationHandler: (requestResponse: RequestResponse) => void;

    private _attemptingSignUp: boolean = false;
    private _attemptingLogin = false;

    update(deltaTime: number) {
        this.signUpBtn.interactable = this.canSignUp();
        this.logInBtn.interactable = this.canLogIn();
    }

    public enableView(showLogin: boolean)
    {
        this.node.active = true;

        this.resetViews();

        if (showLogin)
        {
            this.showLogIn();
        }
    }

    /** Button event handler for the back button */
    public onButtonEvent_Back()
    {
        this.resetViews();
    }

    /** Button event handler for the log in view button */
    public onButtonEvent_Login()
    {
        this.showLogIn();
    }

    /** Button event handler for the sign up view button */
    public onButtonEvent_SignUp()
    {
        this.optionsView.active = false;
        this.signUpView.active = true;
        this.backBtn.active = true;

        this.usernameInput.string = this.emailInput.string = this.passwordInput.string = "";
    }

    /**
     * Button event handler for the sign up button.
     * Initiates user sign up with the server.
     * @param buttonObject The game object the button component is on.
     */
    public onButtonEvent_SubmitSignUp()
    {
        this.signUpErrorMsg.string = "";

        this._attemptingSignUp = true;
        this.signUpSpinner.active = true;

        MMOManager.Instance.userSignUp(this.usernameInput.string, this.emailInput.string, this.passwordInput.string,
            (response) =>
            {
                this._attemptingSignUp = false;
                this.signUpSpinner.active = false;

                this.processUserAuth((error) => this.updateErrorText(error), response);
            });
    }

    public updateErrorText(msg: string)
    {
        this.logInErrorMsg.string = this.signUpErrorMsg.string = msg;
    }

    /**
     * Button event handler for the log in button.
     * Initiates user log in with the server.
     * @param buttonObject The game object the button component is on.
     */
    public onButtonEvent_SubmitLogIn()
    {
        MMOPlayerPrefs.rememberMe = this.rememberMe.isChecked;

        MMOPlayerPrefs.email = this.rememberMe.isChecked ? this.logInEmailInput.string : "";
        MMOPlayerPrefs.password = this.rememberMe.isChecked ? this.logInPasswordInput.string : "";

        this.logInErrorMsg.string = "";

        this._attemptingLogin = true;
        this.logInSpinner.active = true;

        this.logUserIn(this.logInEmailInput.string, this.logInPasswordInput.string, (error) =>
        {
            this._attemptingLogin = false;
            this.logInSpinner.active = false;

            this.updateErrorText(error);
        });
    }

    private resetViews()
    {
        this.optionsView.active = true;
        this.loginView.active = false;
        this.signUpView.active = false;
        this.backBtn.active = false;

        this.rememberMe.isChecked = MMOPlayerPrefs.rememberMe;

        this.passwordInput.string = this.logInPasswordInput.string = this.emailInput.string = this.logInEmailInput.string = this.usernameInput.string = "";

        this.signUpErrorMsg.string = this.logInErrorMsg.string = "";
    }

    /** Enables the UI for the log in process */
    private showLogIn()
    {
        this.optionsView.active = false;
        this.loginView.active = true;
        this.backBtn.active = true;

        if (!MMOPlayerPrefs.rememberMe)
        {
            this.logInEmailInput.string = this.logInPasswordInput.string = "";
        }
        else
        {
            this.logInEmailInput.string = MMOPlayerPrefs.email;
            this.logInPasswordInput.string = MMOPlayerPrefs.password;
        }
    }

    /**
     * Make a request to the serve to log a user in.
     * @param email 
     * @param password 
     * @param onError Callback to execute in the event of an error occurs with the log in attempt.
     */
    public logUserIn(email: string, password: string, onError: (error: string) => void)
    {
        MMOManager.Instance.userLogIn(email, password, (response) => { this.processUserAuth(onError, response); });
    }
    
    /** Checks if necessary inputs contain text and an attempt to sign up is not already in progress */
    private canSignUp(): boolean
    {
        return this.usernameInput.string && 
        this.emailInput.string && 
        this.passwordInput.string && 
        this._attemptingSignUp === false &&
        this._attemptingLogin === false;
    }

    /**
     * Checks if necessary inputs contain text and an attempt to log in is not already in progress
     * @returns 
     */
    private canLogIn(): boolean
    {
        return this.logInEmailInput.string &&
        this.logInPasswordInput.string &&
       this._attemptingLogin === false &&
       this._attemptingSignUp === false;
    }

    /**
     * Handler for log in or sign up requests responses
     * @param onError Callback function for when an error should occur that sends the error message.
     * @param response Response object from the server.
     */
    private processUserAuth(onError: (error: string) => void, response: RequestResponse)
    {
        console.log(`Create User Menu - Process user Auth`);

        if (response.error)
        {
            onError?.(response.output);
        }
        else
        {
            MMOManager.Instance.setCurrentUser(response);

            // Consume the seat reservation by executing handler
            this.consumeSeatReservationHandler(response);
        }
    }
}
