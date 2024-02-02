document.addEventListener('DOMContentLoaded', function () {
    let dragged;

    // Function to directly update the display of placeholders in all categories
    function updateAllPlaceholders() {
        const categories = ['pending-tasks', 'in-progress-tasks', 'completed-tasks'];
        const placeholderMessages = {
            'pending-tasks': 'No Pending Tasks - Drop or Add tasks here',
            'in-progress-tasks': 'No In Progress Tasks - Drop or Add tasks here',
            'completed-tasks': 'No Completed Tasks - Drop or Add tasks here'
        };
    
        categories.forEach(categoryId => {
            const taskCategory = document.getElementById(categoryId);
            if (!taskCategory) return; // Skip if the category does not exist
    
            let placeholder = taskCategory.querySelector('.placeholder');
            const tasks = taskCategory.querySelectorAll('.task-item');
    
            // Create placeholder if it doesn't exist
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'placeholder';
                taskCategory.appendChild(placeholder);
            }
    
            // Set the placeholder text and display style
            placeholder.innerText = placeholderMessages[categoryId];
            placeholder.style.display = tasks.length === 0 ? 'block' : 'none';
        });
    }
    
    const pendingTasks = document.getElementById('pending-tasks');
    if (pendingTasks) {
        updateAllPlaceholders()
    }; 

    // Event listeners for drag and drop
    document.querySelectorAll('.task-item').forEach(function (item) {
        item.addEventListener('dragstart', function (event) {
            dragged = event.target;
        });
    });

    document.querySelectorAll('.task-category').forEach(function (category) {
        category.addEventListener('dragover', function (event) {
            event.preventDefault();
        });

        category.addEventListener('drop', async function (event) {
            event.preventDefault();

            let dropTarget = event.target.closest('.task-category');
            if (dropTarget) {
                let newStatus;
                switch (dropTarget.id) {
                    case 'pending-tasks':
                        newStatus = 'Pending';
                        break;
                    case 'in-progress-tasks':
                        newStatus = 'In Progress';
                        break;
                    case 'completed-tasks':
                        newStatus = 'Completed';
                        break;
                }

                const taskId = dragged.id.split('-')[1];

                try {
                    const response = await fetch('/update_task_status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: taskId, status: newStatus }),
                    });

                    if (response.ok) {
                        dragged.querySelector('.task-status').textContent = newStatus;
                        dropTarget.appendChild(dragged);

                        updateAllPlaceholders()
                    }
                } catch (error) {
                    console.error('Error updating task status:', error);
                }
            }
        });
    });

    // Modify this part
    document.querySelectorAll('.task-delete').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const taskId = this.action.split('/').pop();

            fetch('/delete/' + taskId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => response.json())
            .then(data => {
                if(data.status == 'success') {
                    // Remove the task from the DOM
                    document.getElementById('task-' + taskId).remove();
                    // // Update placeholders
                    const pendingTasks = document.getElementById('pending-tasks');
                    if (pendingTasks) {
                        updateAllPlaceholders()
                    }; 
                } else {
                    console.error('Error:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });


    // Event listener to close the navbar when clicking outside
    document.addEventListener('click', function (event) {
        let navbarToggler = document.querySelector('.navbar-toggler');
        let isNavbarExpanded = navbarToggler.getAttribute('aria-expanded') === 'true';
        let clickedInsideNavbar = navbarToggler.contains(event.target) || document.querySelector('#navbarSupportedContent').contains(event.target);

        if (isNavbarExpanded && !clickedInsideNavbar) {
            navbarToggler.click();
        }
    });

    // Event listener for Delete All Tasks button
    const deleteAllTasksBtn = document.getElementById('delete-all-tasks-btn');
    if (deleteAllTasksBtn) {
        deleteAllTasksBtn.addEventListener('click', async function () {
            const confirmDeletion = confirm('Are you sure you want to delete all tasks?');
            if (confirmDeletion) {
                try {
                    const response = await fetch('/delete_all_tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (response.ok) {
                        // Remove all task items from the DOM
                        document.querySelectorAll('.task-item').forEach((item) => item.remove());
                        // // Update placeholder visibility on page load
                        const pendingTasks = document.getElementById('pending-tasks');
                        if (pendingTasks) {
                            updateAllPlaceholders()
                        }; 

                    }
                } catch (error) {
                    console.error('Error deleting all tasks:', error);
                }
            }
        });
    }

    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function () {
            const confirmDeletion = confirm('Are you sure you want to delete your account? This action cannot be undone.');
            if (confirmDeletion) {
                // Make an API call to delete the account
                try {
                    const response = await fetch('/delete_account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });
    
                    if (response.ok) {
                        window.location.href = '/logout';
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                }
            }
        });
    }

    const togglePasswordButton = document.getElementById('togglePassword');
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function (e) {
            const password = document.getElementById('password');
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);

            // Toggle the eye / eye-slash icon
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Function to remove flash messages from the DOM
    function removeFlashMessages() {
        const flashMessages = document.querySelectorAll('.flash-message');
        flashMessages.forEach(function (msg) {
            msg.remove();
        });
    }

    // Remove flash messages after 5 seconds (5000 milliseconds)
    setTimeout(removeFlashMessages, 5000);

    // Password strength checker
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const strengthContainer = document.getElementById('password-check');

    if (strengthContainer) {
        if (passwordInput) {
            passwordInput.addEventListener('input', function () {
                const password = passwordInput.value;
                let strength = 0;
    
                // Check if password is not empty
                if (password) {
                    // Check password against different criteria
                    if (password.match(/[0-9]+/)) {
                        strength++;
                    }
                    if (password.match(/[a-z]+/)) {
                        strength++;
                    }
                    if (password.match(/[A-Z]+/)) {
                        strength++;
                    }
                    if (password.match(/[^a-zA-Z0-9]+/)) {
                        // Special characters
                        strength++;
                    }
    
                    // Update strength bar and text based on the strength
                    switch (strength) {
                        case 0:
                            strengthBar.style.width = '0%';
                            strengthText.textContent = '';
                            break;
                        case 1:
                            strengthBar.style.width = '25%';
                            strengthBar.className = 'progress-bar bg-danger';
                            strengthText.textContent = 'Weak';
                            break;
                        case 2:
                            strengthBar.style.width = '50%';
                            strengthBar.className = 'progress-bar bg-warning';
                            strengthText.textContent = 'Moderate';
                            break;
                        case 3:
                            strengthBar.style.width = '75%';
                            strengthBar.className = 'progress-bar bg-info';
                            strengthText.textContent = 'Strong';
                            break;
                        case 4:
                            strengthBar.style.width = '100%';
                            strengthBar.className = 'progress-bar bg-success';
                            strengthText.textContent = 'Very Strong';
                            break;
                    }
    
                    // Show the strength bar
                    strengthContainer.style.display = 'block';
                } else {
                    // Hide the strength bar if password is empty
                    strengthContainer.style.display = 'none';
                }
            });
        }
    }
});
