# Contact form email setup

The contact form uses the EmailJS REST API with a public key. No private key is needed or stored by the application.

Configure these values in `client/.env.local` for development and in the frontend hosting environment for production, then restart the development server or rebuild the deployment:

```dotenv
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

In your EmailJS **Contact Us** template:

- Set **To Email** to your own fixed recipient address.
- Use `{{name}}` (or `{{from_name}}`) for the sender's name.
- Set **Reply To** to `{{email}}` or `{{reply_to}}`.
- Use `{{subject}}` or `{{title}}` for the subject.
- Include `{{message}}` in the body, and optionally `{{email}}` and `{{time}}`.
- Use double braces to retain EmailJS's default HTML escaping.

The form also supplies `from_email` for templates using that convention. The screenshots show the template ID, but not its contents: confirm its variables and recipient in the EmailJS dashboard before a live send. Add the local and deployed site origins to the EmailJS domain allowlist if one is enabled.

Keep private keys out of `NEXT_PUBLIC_` environment variables. If a key has been shared, refresh it in EmailJS and update the local and production public key values if rotation changes them.

Verification should intercept the EmailJS request and simulate success, failure, and rate limiting, without sending real email. A live delivery test requires explicit authorization.

References: [EmailJS send endpoint](https://www.emailjs.com/docs/rest-api/send/), [template variables](https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/).
