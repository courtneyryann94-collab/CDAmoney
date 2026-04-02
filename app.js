document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('apply-btn');
    const modal = document.getElementById('loan-modal');
    const closeButton = document.getElementById('loan-modal-close');
    const form = document.getElementById('loan-form');
    const ADMIN_EMAIL = 'stevenhuffakercda@gmail.com';

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
        document.body.classList.remove('modal-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function openEmailCopy(payload) {
        const subject = encodeURIComponent('Loan Application Request');
        const body = encodeURIComponent(
            `Loan type: ${payload.loanType}\n` +
            `Name: ${payload.fullName}\n` +
            `Email: ${payload.email}\n` +
            `Phone: ${payload.phone}\n` +
            `Details: ${payload.details}`
        );
        window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
    }

    applyBtn.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
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
});