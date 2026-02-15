export const getTransactionSuccessTemplate = (data: {
  customerName: string;
  transactionId: string;
  date: string;
  amount: number;
  currency: string;
  packageName: string;
  planName: string;
  credits: number;
  supportEmail: string;
}) => {
  const {
    customerName,
    transactionId,
    date,
    amount,
    currency,
    packageName,
    planName,
    credits,
    supportEmail,
  } = data;

  // We use CID (Content-ID) to embed local images directly in the email
  const logoLightCid = 'cid:zaaz-logo-light';
  const logoDarkCid = 'cid:zaaz-logo-dark';

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Transaction Confirmation</title>
    <style>
        :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
        }
        * { box-sizing: border-box; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #ffffff; color: #111111; }
        
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { margin-bottom: 40px; text-align: left; }
        .logo img { height: 32px; }
        
        /* Show/Hide logos based on theme */
        .logo-dark { display: none !important; }
        .logo-light { display: block !important; }

        .header-text { font-size: 24px; font-weight: 600; margin-bottom: 12px; letter-spacing: -0.02em; }
        .sub-text { font-size: 16px; color: #666666; margin-bottom: 40px; }
        
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; border-top: 1px solid #eeeeee; }
        .receipt-row { border-bottom: 1px solid #eeeeee; }
        .receipt-label { padding: 16px 0; color: #666666; font-size: 14px; text-align: left; }
        .receipt-value { padding: 16px 0; font-weight: 500; font-size: 14px; text-align: right; }
        
        .total-row { border-bottom: 2px solid #111111; }
        .total-label { padding: 20px 0; font-weight: 600; font-size: 18px; color: #111111; }
        .total-value { padding: 20px 0; font-weight: 700; font-size: 20px; color: #111111; }
        
        .footer { margin-top: 60px; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 24px; line-height: 1.8; }
        .button { display: inline-block; background-color: #111111; color: #ffffff !important; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; margin-top: 20px; }
        
        /* Dark Mode Overrides */
        @media (prefers-color-scheme: dark) {
            body { background-color: #111111 !important; color: #eeeeee !important; }
            .container { background-color: #111111 !important; }
            .logo-light { display: none !important; }
            .logo-dark { display: block !important; }
            .receipt-table, .receipt-row, .footer { border-color: #333333 !important; }
            .receipt-label, .sub-text, .footer { color: #aaaaaa !important; }
            .receipt-value, .header-text, .total-label, .total-value { color: #ffffff !important; }
            .total-row { border-color: #ffffff !important; }
            .button { background-color: #ffffff !important; color: #111111 !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <!-- Light mode logo -->
            <img src="${logoLightCid}" alt="ZaaZ" class="logo-light">
            <!-- Dark mode logo -->
            <img src="${logoDarkCid}" alt="ZaaZ" class="logo-dark">
        </div>
        
        <div class="header-text">Receipt from ZaaZ</div>
        <div class="sub-text">Hi ${customerName}, thanks for your purchase. Your credits are ready for use.</div>
        
        <table class="receipt-table">
            <tr class="receipt-row">
                <td class="receipt-label">Transaction ID</td>
                <td class="receipt-value">${transactionId}</td>
            </tr>
            <tr class="receipt-row">
                <td class="receipt-label">Date</td>
                <td class="receipt-value">${date}</td>
            </tr>
            <tr class="receipt-row">
                <td class="receipt-label">Package Details</td>
                <td class="receipt-value">${packageName} (${planName})</td>
            </tr>
            <tr class="receipt-row">
                <td class="receipt-label">Credits Added</td>
                <td class="receipt-value">${credits} Credits</td>
            </tr>
            <tr class="total-row">
                <td class="total-label">Total Paid</td>
                <td class="total-value">${amount} ${currency}</td>
            </tr>
        </table>

        <div style="text-align: left;">
            <a href="https://zaaz.com/dashboard" class="button">Access Dashboard</a>
        </div>

        <div class="footer">
            <p><strong>Questions?</strong> Reply to this email or reach us at <a href="mailto:${supportEmail}" style="color: inherit;">${supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ZaaZ. Delivered automatically upon payment confirmation.</p>
        </div>
    </div>
</body>
</html>
  `;
};

export const getTransactionFailedTemplate = (data: {
  customerName: string;
  transactionId: string;
  amount: number;
  currency: string;
  failureReason?: string;
  supportEmail: string;
}) => {
  const {
    customerName,
    transactionId,
    amount,
    currency,
    failureReason,
    supportEmail,
  } = data;

  const logoLightCid = 'cid:zaaz-logo-light';
  const logoDarkCid = 'cid:zaaz-logo-dark';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>Payment Unsuccessful</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #111111; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { margin-bottom: 40px; }
        .logo img { height: 32px; }
        
        /* Show/Hide logos based on theme */
        .logo-dark { display: none !important; }
        .logo-light { display: block !important; }

        .header-text { font-size: 24px; font-weight: 600; margin-bottom: 12px; color: #dc2626; }
        .sub-text { font-size: 16px; color: #666666; margin-bottom: 40px; }
        .details-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 24px; margin-bottom: 40px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .footer { margin-top: 60px; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 24px; }
        .button { display: inline-block; background-color: #111111; color: #ffffff !important; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
        
        @media (prefers-color-scheme: dark) {
            body { background-color: #111111 !important; color: #eeeeee !important; }
            .logo-light { display: none !important; }
            .logo-dark { display: block !important; }
            .details-box { background-color: #1a1a1a !important; border-color: #333333 !important; }
            .sub-text, .footer { color: #aaaaaa !important; }
            .button { background-color: #ffffff !important; color: #111111 !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <!-- Light mode logo -->
            <img src="${logoLightCid}" alt="ZaaZ" class="logo-light">
            <!-- Dark mode logo -->
            <img src="${logoDarkCid}" alt="ZaaZ" class="logo-dark">
        </div>
        <div class="header-text">Payment Attempt Unsuccessful</div>
        <div class="sub-text">Hi ${customerName}, we were unable to process your payment for ZaaZ credits.</div>
        
        <div class="details-box">
            <div class="detail-row">
                <span>Transaction ID</span>
                <strong>${transactionId}</strong>
            </div>
            <div class="detail-row">
                <span>Amount</span>
                <strong>${amount} ${currency}</strong>
            </div>
            ${failureReason ? `<div style="margin-top:16px; color:#dc2626; font-size:13px;">Reason: ${failureReason}</div>` : ''}
        </div>

        <div style="text-align: left;">
            <a href="https://zaaz.com/pricing" class="button">Try Payment Again</a>
        </div>

        <div class="footer">
            <p>If you have questions, please reach us at <a href="mailto:${supportEmail}" style="color: inherit;">${supportEmail}</a></p>
        </div>
    </div>
</body>
</html>
  `;
};
