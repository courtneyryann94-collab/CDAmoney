document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('apply-btn');
    const modal = document.getElementById('loan-modal');
    const closeButton = document.getElementById('loan-modal-close');
    const form = document.getElementById('loan-form');
    const investorBtn = document.getElementById('investor-btn');
    const investorModal = document.getElementById('investor-modal');
    const investorClose = document.getElementById('investor-modal-close');
    const investorForm = document.getElementById('investor-form');
    const ADMIN_EMAIL = 'S.Huffaker@privatemoneycda.com';

    if (!applyBtn || !modal || !closeButton || !form) {
        return;
    }

    function openModal(event) {
        event.preventDefault();
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        form.reset();
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.classList.remove('open');
        investorModal.classList.remove('open');
        document.body.classList.remove('modal-open');
        modal.setAttribute('aria-hidden', 'true');
        investorModal.setAttribute('aria-hidden', 'true');
    }

    function openInvestorModal(event) {
        event.preventDefault();
        investorModal.classList.add('open');
        document.body.classList.add('modal-open');
        investorForm.reset();
        investorModal.setAttribute('aria-hidden', 'false');
    }

    function openEmailCopy(payload, type = 'loan') {
        const subject = encodeURIComponent(
            type === 'investor' ? 'Investor Application Request' : 'Loan Application Request'
        );
        const body = encodeURIComponent(
            type === 'investor'
                ? `Investor Name: ${payload.investorName}\n` +
                  `Company: ${payload.company || 'N/A'}\n` +
                  `Email: ${payload.email}\n` +
                  `Phone: ${payload.phone}\n` +
                  `Details: ${payload.details}`
                : `Loan type: ${payload.loanType}\n` +
                  `Name: ${payload.fullName}\n` +
                  `Email: ${payload.email}\n` +
                  `Phone: ${payload.phone}\n` +
                  `Details: ${payload.details}`
        );
        const mailtoUrl = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
        const link = document.createElement('a');
        link.href = mailtoUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    applyBtn.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    investorBtn?.addEventListener('click', openInvestorModal);
    investorClose?.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    investorModal.addEventListener('click', (event) => {
        if (event.target === investorModal) {
            closeModal();
        }
    });

    const employeeLoginLink = document.getElementById('employee-login-link');
    if (employeeLoginLink) {
        employeeLoginLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '/login';
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const loanType = form.elements['loan-type'].value.trim();
        const fullName = form.elements['full-name'].value.trim();
        const email = form.elements['email'].value.trim();
        const phone = form.elements['phone'].value.trim();
        const details = form.elements['details'].value.trim();

        if (!loanType || !fullName || !email || !phone) {
            alert('Please fill in all required fields before sending your loan application.');
            return;
        }

        const payload = { loanType, fullName, email, phone, details };

        try {
            const response = await fetch('/api/loan-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Server error');
            }

            closeModal();
            openEmailCopy(payload);
        } catch (error) {
            console.error('Application submit failed:', error);
            closeModal();
            openEmailCopy(payload);
        }
    });

    investorForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const investorName = investorForm.elements['investor-name'].value.trim();
        const company = investorForm.elements['investor-company'].value.trim();
        const email = investorForm.elements['investor-email'].value.trim();
        const phone = investorForm.elements['investor-phone'].value.trim();
        const details = investorForm.elements['investor-details'].value.trim();

        if (!investorName || !email || !phone) {
            alert('Please fill in your name, email, and phone number before submitting.');
            return;
        }

        const payload = { investorName, company, email, phone, details };

        try {
            const response = await fetch('/api/investor-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Server error');
            }

            closeModal();
            openEmailCopy(payload, 'investor');
        } catch (error) {
            console.error('Investor submit failed:', error);
            closeModal();
            openEmailCopy(payload, 'investor');
        }
    });
});