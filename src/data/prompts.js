export const PROMPTS = [
    "How is your energy level today compared to yesterday?",
    "What is one thing you are grateful for regarding your body today?",
    "Did you feel mentally clear or foggy today?",
    "How did you sleep last night, and how does it feel now?",
    "What is one small way you took care of yourself today?",
    "Did you experience any physical discomfort today? If so, where?",
    "How did your mood fluctuate throughout the day?",
    "What is one thing you can do tomorrow to improve your well-being?",
    "Did you drink enough water today?",
    "How did your body react to the food you ate today?",
];

export const getDailyPrompt = () => {
    const today = new Date();
    // Create a consistent index based on the date
    // Using day of the year to rotate through prompts
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const index = dayOfYear % PROMPTS.length;
    return PROMPTS[index];
};
