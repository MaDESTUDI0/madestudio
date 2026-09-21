const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

const configured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (configured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

/**
 * Sends the verification code. If SMTP isn't configured (local dev
 * without real credentials), logs it to the console instead so the
 * flow is still testable end to end.
 */
async function sendVerificationEmail(email, code) {
  const subject = 'Код подтверждения — MaDE';
  const text = `Ваш код подтверждения: ${code}\n\nОн действует 10 минут. Если вы не запрашивали регистрацию — просто проигнорируйте это письмо.`;
  const html = `
    <div style="font-family:sans-serif;color:#241D19;">
      <p>Ваш код подтверждения:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#5E1F2B;">${code}</p>
      <p style="color:#A8846A;font-size:13px;">Действует 10 минут. Если вы не запрашивали регистрацию — проигнорируйте это письмо.</p>
    </div>
  `;

  if (!transporter) {
    console.log('--- DEV EMAIL (no SMTP configured) ---');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('Code:', code);
    console.log('---------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Sends the purchased pattern files as attachments once an order is
 * confirmed paid. Items without an attached file are just listed in
 * the email text — the owner follows up on those separately.
 */
async function sendOrderFiles(email, name, items) {
  const withFile = items.filter((item) => item.fileData);
  const withoutFile = items.filter((item) => !item.fileData);

  const subject = 'Ваш заказ — MaDE';
  const lines = [
    `Здравствуйте${name ? ', ' + name : ''}!`,
    '',
    'Спасибо за оплату. Ваш заказ:',
    ...items.map((item) => `— ${item.label}`),
    ''
  ];
  if (withFile.length) lines.push('Файлы приложены к этому письму.');
  if (withoutFile.length) lines.push('Остальные позиции пришлём отдельно.');
  const text = lines.join('\n');
  const html = `
    <div style="font-family:sans-serif;color:#241D19;">
      <p>Здравствуйте${name ? ', ' + name : ''}!</p>
      <p>Спасибо за оплату. Ваш заказ:</p>
      <ul>${items.map((item) => `<li>${item.label}</li>`).join('')}</ul>
      ${withFile.length ? '<p>Файлы приложены к этому письму.</p>' : ''}
      ${withoutFile.length ? '<p style="color:#A8846A;font-size:13px;">Остальные позиции пришлём отдельно.</p>' : ''}
    </div>
  `;

  if (!transporter) {
    console.log('--- DEV EMAIL (no SMTP configured) ---');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('Items:', items.map((item) => item.label).join(', '));
    console.log('---------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject,
    text,
    html,
    attachments: withFile.map((item) => ({
      filename: item.fileName || (item.label + '.pdf'),
      content: item.fileData,
      contentType: item.fileMime || undefined
    }))
  });
}

module.exports = { sendVerificationEmail, sendOrderFiles, isConfigured: configured };
