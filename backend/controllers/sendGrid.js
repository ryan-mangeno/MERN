const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
const options = {
auth: {
api_user:  "ma058102@ucf.edu",
api_key: process.env.SENDGRID_API_KEY
}
};
const client = nodemailer.createTransport(sgTransport(options));