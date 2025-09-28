window.addEventListener('DOMContentLoaded', () => {
    const terminals = document.querySelectorAll('.terminal');

    terminals.forEach(term => {
        const lines = term.querySelectorAll(':scope > *');
        lines.forEach(x => x.style.display = 'none');
        let i = 0;

        function showNextLine() {
            if (i >= lines.length) return;
            lines[i].style.display = 'block';
            i++;
            setTimeout(showNextLine, 200);
        }

        showNextLine();
    });
});
