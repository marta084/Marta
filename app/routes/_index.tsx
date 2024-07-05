// app/routes/_index.tsx
import { useLoaderData } from "@remix-run/react";
import { type MetaFunction, json } from "@remix-run/cloudflare";
import { format, getDay, addHours, parseISO, isAfter } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { Meta } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: "Marta" },
    {
      property: "og:title",
      content: "let do this,",
    },
    {
      name: "description",
      content: "do this app,",
    },
  ];
};

interface Task {
  task: string;
  time: string;
  instruction: string;
}

interface LoaderData {
  date: string;
  tasks: Task[];
}

const dailyTasks: Task[] = [
  { task: "Wake up at 6 AM", time: "05:45", instruction: "Time to wake up! Get out of bed immediately." },
  { task: "Drink a large glass of water", time: "06:00", instruction: "Hydrate yourself right after waking up." },
  { task: "10 minutes of meditation", time: "06:05", instruction: "Find a quiet spot and focus on your breathing." },
  { task: "Visualize your goals", time: "06:15", instruction: "Spend 5 minutes visualizing your success and goals." },
  { task: "Cold shower for 30 seconds", time: "06:20", instruction: "Start with warm water, then switch to cold for the last 30 seconds." },
  { task: "Healthy breakfast", time: "06:30", instruction: "Prepare a nutritious breakfast with protein and complex carbs within 30 minutes of waking." },
  { task: "Mindfulness practice", time: "12:00", instruction: "Take a moment to practice mindfulness during lunch." },
  { task: "Hydration check", time: "14:00", instruction: "Drink a glass of water. Aim for 2-3 liters daily." },
  { task: "Stress management", time: "17:00", instruction: "Practice deep breathing or quick meditation." },
  { task: "Limit screen time", time: "21:00", instruction: "Avoid blue light exposure 1 hour before bed." },
  { task: "Journal", time: "21:30", instruction: "Write down one thing you're proud of today." },
  { task: "Prepare for tomorrow", time: "22:00", instruction: "Set out clothes for tomorrow, review your schedule." },
];

const weekdaySpecificTasks: { [key: number]: Task[] } = {
  1: [{ task: "Strength Training", time: "07:00", instruction: "Focus on compound movements: squats, deadlifts, bench press, pull-ups. Increase weight or reps from last week." }],
  2: [{ task: "20-minute run", time: "07:00", instruction: "Prepare your running clothes now. Start with a 5-minute walk, then run at a comfortable pace." }],
  3: [{ task: "Yoga session", time: "07:00", instruction: "30 minutes of yoga for flexibility and mental clarity." }],
  4: [{ task: "Strength Training", time: "07:00", instruction: "Focus on compound movements. Remember to progressively overload." }],
  5: [{ task: "20-minute run", time: "07:00", instruction: "Aim to increase your pace or distance slightly from Tuesday's run." }],
  6: [{ task: "Active Recovery", time: "07:00", instruction: "Light exercise, stretching, or a leisurely walk. Listen to your body." }],
  0: [{ task: "Rest day - Meal Prep", time: "10:00", instruction: "Prepare healthy meals for the week. Include lean proteins, complex carbs, and vegetables." }],
};

const weeklyTasks: Task[] = [
  { task: "Weekly Review", time: "Sunday 20:00", instruction: "Reflect on your progress, plan for the upcoming week, and adjust goals if needed." },
  { task: "Grocery Shopping", time: "Sunday 11:00", instruction: "Stock up on healthy foods for the week. Stick to your list and avoid junk food." },
  { task: "Foam Rolling", time: "Wednesday 20:00", instruction: "Spend 15-20 minutes foam rolling major muscle groups for recovery." },
  { task: "Social Support Check-in", time: "Saturday 15:00", instruction: "Share your progress with a friend or family member for accountability." },
];

export const loader = async () => {
  const today = new Date();
  const dayOfWeek = getDay(today);
  const tasks = [
    ...dailyTasks,
    ...(weekdaySpecificTasks[dayOfWeek] || []),
    ...weeklyTasks
  ];
  return json<LoaderData>({ 
    date: format(today, "EEEE, MMMM d, yyyy"), 
    tasks 
  });
};

export default function Index() {
  const { date, tasks } = useLoaderData<LoaderData>();
  const [checkedTasks, setCheckedTasks] = useState<{ [key: string]: boolean }>({});
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [motivation, setMotivation] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const storedDate = localStorage.getItem("lastCheckedDate");
    if (storedDate !== date) {
      localStorage.setItem("lastCheckedDate", date);
      localStorage.setItem("checkedTasks", JSON.stringify({}));
      setCheckedTasks({});
    } else {
      const storedChecks = JSON.parse(localStorage.getItem("checkedTasks") || "{}");
      setCheckedTasks(storedChecks);
    }

    const storedTotal = parseInt(localStorage.getItem("totalCompleted") || "0");
    setTotalCompleted(storedTotal);

    const storedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
    setNotes(storedNotes);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const motivationQuotes = [
      "Every day is a new opportunity to improve yourself. Take it and make the most of it.",
      "The only bad workout is the one that didn't happen.",
      "Your body can stand almost anything. It's your mind that you have to convince.",
      "The difference between try and triumph is just a little umph!",
      "The hardest lift of all is lifting your butt off the couch.",
    ];
    setMotivation(motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)]);

    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Set up task notifications
    tasks.forEach(task => {
      const [hours, minutes] = task.time.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(hours, minutes, 0, 0);
      
      const timeUntilTask = taskTime.getTime() - new Date().getTime();
      
      if (timeUntilTask > 0) {
        setTimeout(() => {
          sendNotification(task.task, task.instruction);
          playSound();
        }, timeUntilTask);
      }
    });

    // Check for uncompleted tasks every hour
    const checkInterval = setInterval(() => {
      const uncompletedTasks = tasks.filter(task => !checkedTasks[task.task]);
      if (uncompletedTasks.length > 0) {
        sendNotification("Reminder", "You have uncompleted tasks!");
        playSound();
      }
    }, 3600000); // 1 hour

    return () => {
      clearInterval(timer);
      clearInterval(checkInterval);
    };
  }, [date, tasks]);

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleCheck = (task: string) => {
    const newCheckedTasks = { ...checkedTasks, [task]: !checkedTasks[task] };
    setCheckedTasks(newCheckedTasks);
    localStorage.setItem("checkedTasks", JSON.stringify(newCheckedTasks));

    const completedCount = Object.values(newCheckedTasks).filter(Boolean).length;
    const newTotal = totalCompleted + (newCheckedTasks[task] ? 1 : -1);
    setTotalCompleted(newTotal);
    localStorage.setItem("totalCompleted", newTotal.toString());
  };

  const handleAddNote = () => {
    if (note.trim()) {
      const newNotes = [...notes, note];
      setNotes(newNotes);
      localStorage.setItem("notes", JSON.stringify(newNotes));
      setNote("");
    }
  };

  const allTasksCompleted = tasks.every(task => checkedTasks[task.task]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 px-4 py-5 sm:px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">{date}</h1>
          <div className="text-white text-right">
            <p className="text-sm">Oujda, Morocco</p>
            <p className="text-2xl font-semibold">{format(addHours(currentTime, 1), "HH:mm:ss")}</p>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <p className="text-lg font-semibold text-indigo-600 mb-4">{motivation}</p>
          <h2 className="text-xl font-semibold mb-4">Today's Tasks:</h2>
          <ul className="space-y-4">
            {tasks.map((task, index) => (
              <li key={index} className="bg-gray-50 rounded-lg p-4 shadow">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={checkedTasks[task.task] || false}
                    onChange={() => handleCheck(task.task)}
                    className="h-5 w-5 text-indigo-600"
                  />
                  <span className={`ml-3 ${checkedTasks[task.task] ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.task} - {task.time}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{task.instruction}</p>
              </li>
            ))}
          </ul>
          {allTasksCompleted && (
            <p className="mt-6 text-green-600 font-semibold text-center text-xl">Good job, Marta! You've completed all tasks for today!</p>
          )}
          <p className="mt-4 text-indigo-600 font-semibold">Total tasks completed: {totalCompleted}</p>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Progress Notes:</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Add a note about your progress, challenges, or ideas for improvement..."
              rows={3}
            />
            <button
              onClick={handleAddNote}
              className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition duration-150"
            >
              Add Note
            </button>
            <ul className="mt-4 space-y-2">
              {notes.map((note, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded-lg shadow">{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <audio ref={audioRef}>
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}