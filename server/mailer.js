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
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Reuses SMTP connections instead of doing a fresh TCP+TLS
    // handshake with Brevo on every single email — that handshake is
    // most of what made each send feel slow, especially on Render's
    // free tier. Actual inbox delivery time after that is Brevo's and
    // the recipient's mail provider's call, not something here.
    pool: true,
    maxConnections: 3,
    maxMessages: 100
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

const CABINET_URL = 'https://madestudio.net/cabinet.html';

/**
 * Sends the purchase receipt once an order is confirmed paid. Each
 * item is one of three kinds, each described differently in the email:
 *   - a file was attached to it        -> delivered as an attachment
 *   - a course/module was granted      -> "открыт доступ в личном кабинете"
 *   - neither (no file on record)      -> "пришлём отдельно" fallback
 */
function money(value) {
  return Number(value || 0).toLocaleString('ru-RU') + ' ₸';
}

async function sendOrderReceipt(email, name, items, orderId) {
  const withFile = items.filter((item) => item.fileData);
  const courseItems = items.filter((item) => item.productType === 'course_module' || item.productType === 'course_full');
  const otherPending = items.filter((item) => !item.fileData && item.productType !== 'course_module' && item.productType !== 'course_full');
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const subject = 'Ваш заказ' + (orderId ? ' №' + orderId : '') + ' — MaDE';
  const lines = [
    `Здравствуйте${name ? ', ' + name : ''}!`,
    '',
    'Спасибо за оплату. Ваш заказ' + (orderId ? ' №' + orderId : '') + ':',
    ...items.map((item) => `— ${item.label}${item.price ? ' — ' + money(item.price) : ''}`),
    '',
    `Итого: ${money(total)}`,
    ''
  ];
  if (withFile.length) lines.push('Файлы приложены к этому письму.');
  if (courseItems.length) lines.push(`Доступ открыт в личном кабинете: ${CABINET_URL}`);
  if (otherPending.length) lines.push('Остальные позиции пришлём отдельно.');
  const text = lines.join('\n');
  const html = `
    <div style="font-family:sans-serif;color:#241D19;">
      <p>Здравствуйте${name ? ', ' + name : ''}!</p>
      <p>Спасибо за оплату. Ваш заказ${orderId ? ' №' + orderId : ''}:</p>
      <ul>${items.map((item) => `<li>${item.label}${item.price ? ' — <strong>' + money(item.price) + '</strong>' : ''}</li>`).join('')}</ul>
      <p style="font-size:16px;"><strong>Итого: ${money(total)}</strong></p>
      ${withFile.length ? '<p>Файлы приложены к этому письму.</p>' : ''}
      ${courseItems.length ? `<p>Доступ открыт в личном кабинете: <a href="${CABINET_URL}">${CABINET_URL}</a></p>` : ''}
      ${otherPending.length ? '<p style="color:#A8846A;font-size:13px;">Остальные позиции пришлём отдельно.</p>' : ''}
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

module.exports = { sendVerificationEmail, sendOrderReceipt, isConfigured: configured };
