import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { initializeSampleData } from './utils/sampleData';

function App() {
    useEffect(() => {
        initializeSampleData();

        // Suppress known Recharts duplicate key warnings
        const originalError = console.error;
        console.error = (...args) => {
            if (
                typeof args[0] === 'string' &&
                args[0].includes('Encountered two children with the same key')
            ) {
                return;
            }
            originalError.apply(console, args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    return (
        <>
            <RouterProvider router={router} />
            <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                    style: {
                        background: 'rgba(26, 31, 60, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                    },
                }}
            />
        </>
    );
}

export default App;