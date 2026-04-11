export type ICreateAccount = {
    name: string;
    email: string;
    otp: number;
};
  
export type IResetPassword = {
    email: string;
    otp: number;
};

export type IEventInvitation = {
    email: string;
    name: string;
    eventName: string;
    eventDescription?: string;
    eventDate?: string;
    eventLocation?: string;
};