import nodemailer from 'nodemailer';
import bcryptjs from "bcryptjs"
import User from '@/models/userModel';

export const sendMail = async({email, emailType, userID}: any) =>{
    try {

      const hashedToken = await bcryptjs.hash(userID.toString(), 10)
        //TODO ::::: configure mail for usage
        if(emailType === "VERIFY"){
          await User.findByIdAndUpdate(userID,
             {verifyToken: hashedToken, verifyTokenExpiry: Date.now() + 3600000})
        } else if(emailType === "RESET"){
          await User.findByIdAndUpdate(userID,
            {forgotPasswordToken: hashedToken, forgotPasswordTokenExpiry: Date.now() + 3600000})
        }

        var transport = nodemailer.createTransport({
          host: "sandbox.smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: "1f08e73fabf805",
            pass: "c69d70beb07615"
          }
        });

          const mailOptions = {
            from: 'nadeemkhan6993@gmail.com', // sender address
            to: email, // list of receivers
            subject: emailType === "VERIFY" ? "Verify your email" : "Reset your password", // Subject line
            html: `<p>Click <a href="${process.env.DOMAIN}/verifyemail?token=${hashedToken}">here</a> to 
            ${emailType === "VERIFY" ?
               "Verify your email"  : "Reset your password"} or
                copy and paste the link below in your browser.<br>
                 ${process.env.DOMAIN}/verifyemail?token=${hashedToken}</p>`,
          }

          const mailResponse = await transport.sendMail(mailOptions)
          return mailResponse
    } catch (error:any) {
        throw new Error(error.message)
    }
}