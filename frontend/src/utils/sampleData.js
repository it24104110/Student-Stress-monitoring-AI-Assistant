export const initializeSampleData = () => {
    const existingEntries = localStorage.getItem('moodEntries');
    if (existingEntries && JSON.parse(existingEntries).length > 0) return;

    const entries = [];
    const today = new Date();

    // Generate slightly varied mock data for the last 14 days
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Pattern: slightly worse during week, better weekends
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Base values that fluctuate
        // Happy/Excited on weekends, Neutral/Stressed on weekdays
        let mood = isWeekend ? 'happy' : (Math.random() > 0.5 ? 'neutral' : 'happy');
        const stressLevel = isWeekend ?
            Math.floor(Math.random() * 2) + 1 : // 1-2
            Math.floor(Math.random() * 3) + 2;  // 2-4

        const energyLevel = isWeekend ?
            Math.floor(Math.random() * 2) + 4 : // 4-5
            Math.floor(Math.random() * 3) + 2;  // 2-4

        const sleepQuality = Math.floor(Math.random() * 3) + 3; // 3-5

        // Add some bad days randomly
        if (Math.random() > 0.85) {
            mood = Math.random() > 0.5 ? 'sad' : 'angry';
        }

        entries.push({
            date: date.toISOString(),
            mood,
            stressLevel,
            energyLevel,
            sleepQuality,
            notes: ""
        });
    }

    localStorage.setItem('moodEntries', JSON.stringify(entries));
};
