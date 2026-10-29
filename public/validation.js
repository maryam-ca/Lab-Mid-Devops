(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SubmissionValidation = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function isValidUrl(value) {
    try {
      const u = new URL(value);
      return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
    } catch {
      return false;
    }
  }

  // Returns { valid, errors, value } where value holds the trimmed fields.
  function validateSubmission(input) {
    const src = input || {};
    const value = {
      name: String(src.name ?? '').trim(),
      regNo: String(src.regNo ?? '').trim(),
      title: String(src.title ?? '').trim(),
      url: String(src.url ?? '').trim(),
    };
    const errors = [];
    if (!value.name) errors.push('Name is required');
    if (!value.regNo) errors.push('Registration number is required');
    if (!value.title) errors.push('Assignment title is required');
    if (!value.url) errors.push('Submission URL is required');
    else if (!isValidUrl(value.url)) errors.push('Submission URL is invalid (use a full http:// or https:// link)');
    return { valid: errors.length === 0, errors, value };
  }

  return { validateSubmission, isValidUrl };
});
