// Define the watermark string
const watermark = "&copy; MIT License.";

// Define the navigation bar HTML
const navbar = `
    <nav>
        <a href="index.html">Homepage</a>
        <a href="test1.html">Canvas Test</a>
        <a href="test2.html">FlowNetTK</a>
        <a href="test3.html">Simulation Test</a>
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
    const header = document.querySelector('header');
    if (header) {
        header.insertAdjacentHTML('afterend', navbar);
    }
}

// Run the functions on page load using addEventListener
window.addEventListener('load', function() {
    insertNavbar();
    insertWatermark();
});
