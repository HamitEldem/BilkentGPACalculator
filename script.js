const GRADE_POINTS = {
    'A+': 4.00, 'A': 4.00, 'A-': 3.70,
    'B+': 3.30, 'B': 3.00, 'B-': 2.70,
    'C+': 2.30, 'C': 2.00, 'C-': 1.70,
    'D+': 1.30, 'D': 1.00,
    'F': 0.00, 'FX': 0.00, 'FZ': 0.00
};

let selectedCourses = [];

function initializeSearch() {
    const searchInput = document.getElementById('courseSearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.trim().toUpperCase();
        
        searchResults.style.display = searchTerm.length < 2 ? 'none' : 'block';
        
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        try {
            const response = await fetch('courses.json');
            const courses = await response.json();
            
            const filteredCourses = courses.filter(course => 
                course.code.toUpperCase().includes(searchTerm)
            ).slice(0, 5);
            
            displaySearchResults(filteredCourses);
        } catch (error) {
            console.error('Error fetching courses:', error);
            searchResults.innerHTML = '<div class="search-result-item">Error loading courses</div>';
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function displaySearchResults(courses) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (courses.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No courses found</div>';
        return;
    }
    
    courses.forEach(course => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.textContent = course.code;
        div.addEventListener('click', () => {
            selectCourse(course);
            searchResults.style.display = 'none';
            document.getElementById('courseSearch').value = '';
        });
        searchResults.appendChild(div);
    });
}

function selectCourse(course) {
    if (!selectedCourses.some(c => c.code === course.code)) {
        selectedCourses.push(course);
        addCourseToList(course);
        updateTotalCredits();
        
        // Hide empty state message
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Clear search
        const searchInput = document.getElementById('courseSearch');
        const searchResults = document.getElementById('searchResults');
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
    }
}

function addCourseToList(course) {
    // Add to sidebar
    const courseElement = document.createElement('div');
    courseElement.className = 'course-pill';
    courseElement.innerHTML = `
        <div class="course-pill-content">
            ${course.code}
        </div>
        <button class="remove-button" onclick="removeCourse('${course.code}')">×</button>
    `;
    
    const selectedCoursesList = document.getElementById('selectedCoursesList');
    selectedCoursesList.appendChild(courseElement);
    
    // Add to main course list
    const courseListBody = document.getElementById('courseListBody');
    const courseRow = document.createElement('div');
    courseRow.className = 'course-row';
    courseRow.setAttribute('data-course-code', course.code);
    courseRow.innerHTML = `
        <div class="course-code">${course.code}</div>
        <div class="course-name">${course.name}</div>
        <div class="course-credits">${course.credits.bilkent}</div>
        <div class="course-grade">
            <select class="grade-select" onchange="calculateGPA()">
                <option value="">Grade</option>
                ${Object.keys(GRADE_POINTS).map(grade => 
                    `<option value="${grade}">${grade}</option>`
                ).join('')}
            </select>
        </div>
    `;
    courseListBody.appendChild(courseRow);
}

function removeCourse(courseCode) {
    // Remove from selectedCourses array
    selectedCourses = selectedCourses.filter(course => course.code !== courseCode);
    
    // Remove from sidebar
    const coursePills = document.querySelectorAll('.course-pill');
    coursePills.forEach(pill => {
        if (pill.textContent.includes(courseCode)) {
            pill.remove();
        }
    });
    
    // Remove from main list
    const courseRow = document.querySelector(`.course-row[data-course-code="${courseCode}"]`);
    if (courseRow) {
        courseRow.remove();
    }
    
    // Show empty state if no courses left
    if (selectedCourses.length === 0) {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }
    
    // Update calculations
    updateTotalCredits();
    calculateGPA();
}

function addCourseToGradeSection(course) {
    const gradeInputsContainer = document.getElementById('gradeInputs');
    const courseRow = document.createElement('div');
    courseRow.className = 'grade-row';
    courseRow.innerHTML = `
        <div class="course-info">
            <span class="course-code">${course.code}</span>
            <span class="course-name">${course.name}</span>
            <span class="course-credits">${course.credits.bilkent} credits</span>
        </div>
        <select class="grade-select" onchange="calculateGPA()">
            <option value="">Select Grade</option>
            ${Object.keys(GRADE_POINTS).map(grade => 
                `<option value="${grade}">${grade}</option>`
            ).join('')}
        </select>
    `;
    gradeInputsContainer.appendChild(courseRow);
}

function calculateGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    const courseRows = document.querySelectorAll('.course-row');
    courseRows.forEach(row => {
        const gradeSelect = row.querySelector('.grade-select');
        const credits = parseFloat(row.querySelector('.course-credits').textContent);
        
        if (gradeSelect && gradeSelect.value && !isNaN(credits)) {
            const grade = gradeSelect.value;
            if (GRADE_POINTS[grade]) {
                totalPoints += GRADE_POINTS[grade] * credits;
                totalCredits += credits;
            }
        }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    
    // Determine honor status with appropriate class
    let honorStatus = '';
    let honorClass = '';
    if (gpa >= 3.50) {
        honorStatus = 'High Honor Student';
        honorClass = 'high-honor';
    } else if (gpa >= 3.00) {
        honorStatus = 'Honor Student';
        honorClass = 'honor';
    }

    // Update GPA and honor status in sidebar
    const creditsSummary = document.querySelector('.credits-summary');
    creditsSummary.innerHTML = `
        <div class="credits-info">
            <span>Total Credits</span>
            <span>${totalCredits}</span>
        </div>
        <div class="credits-info">
            <span>GPA</span>
            <div class="gpa-container">
                <span class="gpa-number">${gpa}</span>
                ${honorStatus ? `<span class="honor-status ${honorClass}">${honorStatus}</span>` : ''}
            </div>
        </div>
    `;
}

function updateHonorsStatus(gpa) {
    const honorsStatus = document.getElementById('honorsStatus');
    if (honorsStatus) {
        if (gpa >= 3.50) {
            honorsStatus.textContent = 'High Honor Student';
            honorsStatus.style.color = '#10b981';
        } else if (gpa >= 3.00) {
            honorsStatus.textContent = 'Honor Student';
            honorsStatus.style.color = '#3b82f6';
        } else {
            honorsStatus.textContent = '';
        }
    }
}

function updateTotalCredits() {
    let total = 0;
    selectedCourses.forEach(course => {
        const credits = parseFloat(course.credits.bilkent);
        if (!isNaN(credits)) {
            total += credits;
        }
    });
    
    // Update total credits display
    const totalCreditsElement = document.querySelector('.credits-summary .credits-number');
    if (totalCreditsElement) {
        totalCreditsElement.textContent = total.toString();
    }
}

// Initialize the search functionality when the page loads
document.addEventListener('DOMContentLoaded', initializeSearch);