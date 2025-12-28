import html2pdf from 'html2pdf.js';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateShort = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusText = (status) => {
  const statusMap = {
    pending_engineer: 'بانتظار المهندس',
    approved_by_engineer: 'معتمد من المهندس',
    rejected_by_engineer: 'مرفوض',
    purchase_order_issued: 'تم إصدار أمر الشراء',
    partially_ordered: 'جاري الإصدار'
  };
  return statusMap[status] || status;
};

const getOrderStatusText = (status) => {
  const statusMap = {
    pending_approval: 'بانتظار الاعتماد',
    approved: 'معتمد',
    printed: 'تمت الطباعة'
  };
  return statusMap[status] || status;
};

const generatePDF = async (htmlContent, filename) => {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.cssText = 'position: absolute; left: -9999px; top: 0; direction: rtl; font-family: "Cairo", "Segoe UI", Tahoma, Arial, sans-serif;';
  document.body.appendChild(container);

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
};

export const exportRequestToPDF = async (request) => {
  const items = Array.isArray(request.items) ? request.items : [];
  const itemsRows = items.map((item, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#fff'};">
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.name || '-'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${item.unit || 'قطعة'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="padding: 20px; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; max-width: 800px;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #ea580c; text-align: center; font-size: 28px; margin: 0;">طلب مواد</h1>
        <p style="text-align: center; color: #64748b; margin: 5px 0;">رقم الطلب: ${request.id?.slice(0, 8).toUpperCase() || 'N/A'}</p>
      </div>
      
      <!-- Request Info -->
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px;"><strong>المشروع:</strong> ${request.project_name || '-'}</td>
            <td style="padding: 8px;"><strong>تاريخ الطلب:</strong> ${formatDate(request.created_at)}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>المشرف:</strong> ${request.supervisor_name || '-'}</td>
            <td style="padding: 8px;"><strong>المهندس:</strong> ${request.engineer_name || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>الحالة:</strong> <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px;">${getStatusText(request.status)}</span></td>
            <td style="padding: 8px;"><strong>سبب الطلب:</strong> ${request.reason || '-'}</td>
          </tr>
        </table>
      </div>
      
      <!-- Items Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 5px;">الأصناف المطلوبة</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #ea580c; color: white;">
              <th style="padding: 10px; border: 1px solid #ea580c; width: 50px;">#</th>
              <th style="padding: 10px; border: 1px solid #ea580c;">اسم المادة</th>
              <th style="padding: 10px; border: 1px solid #ea580c; width: 80px;">الكمية</th>
              <th style="padding: 10px; border: 1px solid #ea580c; width: 80px;">الوحدة</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>
      
      ${request.rejection_reason ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #dc2626;">سبب الرفض:</strong> ${request.rejection_reason}
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #64748b; font-size: 12px;">
        <p>نظام إدارة طلبات المواد</p>
        <p>تاريخ الطباعة: ${formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  `;

  await generatePDF(html, `طلب_مواد_${request.id?.slice(0, 8) || 'request'}.pdf`);
};

export const exportPurchaseOrderToPDF = async (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsRows = items.map((item, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#fff'};">
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.name || '-'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${item.unit || 'قطعة'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="padding: 20px; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; max-width: 800px;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #ea580c; border-top: 3px solid #ea580c; padding: 15px 0; margin-bottom: 20px;">
        <h1 style="color: #ea580c; text-align: center; font-size: 30px; margin: 0;">أمر شراء</h1>
        <p style="text-align: center; color: #1e293b; font-size: 16px; margin: 5px 0;">رقم الأمر: ${order.id?.slice(0, 8).toUpperCase() || 'N/A'}</p>
      </div>
      
      <!-- Order Info -->
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; width: 50%;"><strong>المشروع:</strong> ${order.project_name || '-'}</td>
            <td style="padding: 8px;"><strong>تاريخ الإصدار:</strong> ${formatDate(order.created_at)}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>المورد:</strong> <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px;">${order.supplier_name || '-'}</span></td>
            <td style="padding: 8px;"><strong>مدير المشتريات:</strong> ${order.manager_name || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>الحالة:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px;">${getOrderStatusText(order.status)}</span></td>
            <td style="padding: 8px;">${order.approved_at ? `<strong>تاريخ الاعتماد:</strong> ${formatDate(order.approved_at)}` : ''}</td>
          </tr>
        </table>
      </div>
      
      <!-- Items Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 5px;">المواد</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #ea580c; color: white;">
              <th style="padding: 10px; border: 1px solid #ea580c; width: 50px;">#</th>
              <th style="padding: 10px; border: 1px solid #ea580c;">اسم المادة</th>
              <th style="padding: 10px; border: 1px solid #ea580c; width: 80px;">الكمية</th>
              <th style="padding: 10px; border: 1px solid #ea580c; width: 80px;">الوحدة</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>
      
      ${order.notes ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
          <strong>ملاحظات:</strong> ${order.notes}
        </div>
      ` : ''}
      
      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 20px;">
        <div style="text-align: center; width: 40%;">
          <div style="border-top: 1px solid #64748b; padding-top: 10px;">توقيع المورد</div>
        </div>
        <div style="text-align: center; width: 40%;">
          <div style="border-top: 1px solid #64748b; padding-top: 10px;">توقيع مدير المشتريات</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #64748b; font-size: 12px; margin-top: 30px;">
        <p>نظام إدارة طلبات المواد</p>
        <p>تاريخ الطباعة: ${formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  `;

  await generatePDF(html, `امر_شراء_${order.id?.slice(0, 8) || 'order'}.pdf`);
};

export const exportRequestsTableToPDF = async (requests, title = 'قائمة الطلبات') => {
  const rows = requests.map((r, idx) => {
    const items = Array.isArray(r.items) ? r.items : [];
    const itemsSummary = items.length > 0 
      ? (items.length === 1 ? items[0].name : `${items[0].name} +${items.length - 1}`)
      : '-';
    return `
      <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#fff'};">
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${itemsSummary}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${r.project_name || '-'}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${r.supervisor_name || '-'}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${r.engineer_name || '-'}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${getStatusText(r.status)}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${formatDateShort(r.created_at)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div style="padding: 15px; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl;">
      <h2 style="color: #ea580c; text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">${title}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px;">
        <thead>
          <tr style="background: #ea580c; color: white;">
            <th style="padding: 8px; border: 1px solid #ea580c;">الأصناف</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">المشروع</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">المشرف</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">المهندس</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">الحالة</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">التاريخ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align: center; color: #64748b; font-size: 10px; margin-top: 20px;">
        نظام إدارة طلبات المواد - تاريخ التصدير: ${formatDateShort(new Date().toISOString())}
      </p>
    </div>
  `;

  await generatePDF(html, `${title.replace(/\s/g, '_')}.pdf`);
};

export const exportPurchaseOrdersTableToPDF = async (orders) => {
  const rows = orders.map((o, idx) => {
    const items = Array.isArray(o.items) ? o.items : [];
    const itemsSummary = items.length > 0 
      ? (items.length === 1 ? items[0].name : `${items[0].name} +${items.length - 1}`)
      : '-';
    return `
      <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#fff'};">
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${itemsSummary}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${o.project_name || '-'}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${o.supplier_name || '-'}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${o.manager_name || '-'}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${getOrderStatusText(o.status)}</td>
        <td style="padding: 6px; border: 1px solid #e2e8f0;">${formatDateShort(o.created_at)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div style="padding: 15px; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl;">
      <h2 style="color: #ea580c; text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">قائمة أوامر الشراء</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px;">
        <thead>
          <tr style="background: #ea580c; color: white;">
            <th style="padding: 8px; border: 1px solid #ea580c;">الأصناف</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">المشروع</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">المورد</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">مدير المشتريات</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">الحالة</th>
            <th style="padding: 8px; border: 1px solid #ea580c;">التاريخ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align: center; color: #64748b; font-size: 10px; margin-top: 20px;">
        نظام إدارة طلبات المواد - تاريخ التصدير: ${formatDateShort(new Date().toISOString())}
      </p>
    </div>
  `;

  await generatePDF(html, 'اوامر_الشراء.pdf');
};
