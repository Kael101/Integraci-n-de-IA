/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // La Paleta Territorio Jaguar
                jaguar: {
                    400: '#D4B675', // Dorado claro (Hover/Highlights)
                    500: '#C5A059', // DORADO OFICIAL (Accent)
                    600: '#A38240', // Dorado oscuro (Bordes/Sombras)
                    800: '#2A4F40', // Verde selva medio
                    900: '#152E25', // Verde más profundo (Auxiliar)
                    950: '#1B3B2F', // VERDE BASE PROTOTIPO (#1B3B2F)
                },
                // Un blanco "off-white" para textos que no cansa la vista
                surface: '#F8F9FA',
            },
            fontFamily: {
                // Títulos imponentes
                display: ['Montserrat', 'sans-serif'],
                // Lectura cómoda
                body: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                // Un degradado sutil para fondos "premium"
                'jungle-gradient': 'linear-gradient(to bottom right, #1B3B2F, #0D211A)',
            }
        },
    },
    plugins: [],
}

