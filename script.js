// --- REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT DETAILS ---
const SUPABASE_URL = 'https://rosxossqvrisnemjyuaj.supabase.co'; // e.g., 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvc3hvc3NxdnJpc25lbWp5dWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDI0NjgsImV4cCI6MjA1ODU3ODQ2OH0.zkTMTtZEN583UbQ1bwWtiXNqFdmY9JXQzCcuVOFRXgY'; // e.g., 'eyJhbGciOiJIUzI1Ni...'
// ---------------------------------------------------------------

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const passwordResetForm = document.getElementById('passwordResetForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const messageBox = document.getElementById('message');

let accessToken = null; // This will store the token from the URL

function showMessage(message, isError = false) {
    messageBox.classList.remove('d-none', 'success', 'error');
    messageBox.textContent = message;
    if (isError) {
        messageBox.classList.add('error');
    } else {
        messageBox.classList.add('success');
    }
}

// Function to extract token from URL fragment or query parameters
function getAccessTokenFromUrl() {
    const params = new URLSearchParams(window.location.hash.substring(1)); // For #access_token
    const queryParams = new URLSearchParams(window.location.search); // For ?code

    if (params.has('access_token')) {
        return params.get('access_token');
    } else if (queryParams.has('code')) {
        return queryParams.get('code'); // Supabase can also send 'code'
    } else {
        return null;
    }
}

// When the page loads, try to get the access token
document.addEventListener('DOMContentLoaded', () => {
    accessToken = getAccessTokenFromUrl();
    if (!accessToken) {
        showMessage('Invalid or missing password reset token. Please try resetting your password again.', true);
        passwordResetForm.style.display = 'none'; // Hide the form if no token
    } else {
        // If we have a token, we don't show the form right away.
        // Supabase requires setting the session first for recovery links.
        // We'll set the session when the user tries to update the password.
    }
});


passwordResetForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!accessToken) {
        showMessage('No valid reset token found. Please try again.', true);
        return;
    }

    if (newPassword.length < 6) { // Supabase default minimum password length
        showMessage('New password must be at least 6 characters long.', true);
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match.', true);
        return;
    }

    // Disable button to prevent multiple submissions
    const submitButton = passwordResetForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Resetting...';

    try {
        // First, set the session with the access token from the URL
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken });

        if (sessionError) {
            throw new Error(`Failed to set session: ${sessionError.message}`);
        }

        // Then, update the user's password
        const { data, error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            throw new Error(`Password update failed: ${updateError.message}`);
        }

        showMessage('Your password has been successfully reset! You can now log in.', false);
        passwordResetForm.reset(); // Clear the form
        passwordResetForm.style.display = 'none'; // Hide the form on success

        // Optional: Redirect to login page after a few seconds
        setTimeout(() => {
            // Replace with your app's login deep link if you want to redirect back
            // window.location.href = 'azuraapp://login';
            // Or redirect to a login page on your website
            // window.location.href = 'https://yourwebsite.com/login';
        }, 3000);

    } catch (error) {
        console.error('Password reset error:', error);
        showMessage(error.message || 'An unexpected error occurred during password reset.', true);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Reset Password';
    }
});