function generateSaleNumber() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `SAL-${ymd}-${random}`;
}

function generatePONumber() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `PO-${ymd}-${random}`;
}

function generateGRNNumber() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `GRN-${ymd}-${random}`;
}

function generateTransferNumber() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `TRF-${ymd}-${random}`;
}

function generateReturnNumber(prefix = 'RET') {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${ymd}-${random}`;
}

function generateBarcode(sku) {
  const sanitized = (sku || '000').replace(/[^0-9]/g, '').padStart(11, '0');
  return sanitized.slice(0, 12);
}

module.exports = {
  generateSaleNumber,
  generatePONumber,
  generateGRNNumber,
  generateTransferNumber,
  generateReturnNumber,
  generateBarcode,
};
