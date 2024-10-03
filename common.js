// Define the watermark string
const watermark = "&copy; MIT License.";

// Define the navigation bar HTML
const navbar = `
    <nav>
        <a href="index.html">Home</a>
        <a href="test.html">Test</a>
        <a href="test2.html">Test 2</a>
        <a href="test3.html">Test 3</a>
    </nav>
`;

// Function to insert the watermark in the footer
function insertWatermark() {
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = watermark;
    }
}

// Function to insert the navigation bar
function insertNavbar() {
    const body = document.querySelector('header');
    if (body) {
        body.insertAdjacentHTML('afterend', navbar);
    }
}

// Run the functions on page load
window.onload = function() {
    insertNavbar();
    insertWatermark();
};
