require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Train = require("../models/Train");
const FoodItem = require("../models/FoodItem");

const trains = [
    {
        trainNumber: "12951",
        trainName: "Mumbai Rajdhani",
        coaches: [
            { coachNumber: "A1", seats: 24 },
            { coachNumber: "A2", seats: 24 },
            { coachNumber: "B1", seats: 48 },
            { coachNumber: "B2", seats: 48 }
        ]
    },
    {
        trainNumber: "12301",
        trainName: "Howrah Rajdhani",
        coaches: [
            { coachNumber: "A1", seats: 24 },
            { coachNumber: "A2", seats: 24 },
            { coachNumber: "B1", seats: 48 },
            { coachNumber: "B2", seats: 48 }
        ]
    },
    {
        trainNumber: "12002",
        trainName: "Bhopal Shatabdi",
        coaches: [
            { coachNumber: "C1", seats: 78 },
            { coachNumber: "C2", seats: 78 }
        ]
    },
    {
        trainNumber: "12007",
        trainName: "Chennai Mysuru Shatabdi",
        coaches: [
            { coachNumber: "C1", seats: 78 },
            { coachNumber: "C2", seats: 78 }
        ]
    },
    {
        trainNumber: "12009",
        trainName: "Mumbai Ahmedabad Shatabdi",
        coaches: [
            { coachNumber: "C1", seats: 78 },
            { coachNumber: "C2", seats: 78 }
        ]
    },
    {
        trainNumber: "12005",
        trainName: "Kalka Shatabdi",
        coaches: [
            { coachNumber: "C1", seats: 78 },
            { coachNumber: "C2", seats: 78 }
        ]
    },
    {
        trainNumber: "22691",
        trainName: "Bengaluru Rajdhani",
        coaches: [
            { coachNumber: "A1", seats: 24 },
            { coachNumber: "B1", seats: 48 },
            { coachNumber: "B2", seats: 48 }
        ]
    },
    {
        trainNumber: "12027",
        trainName: "Bengaluru Chennai Shatabdi",
        coaches: [
            { coachNumber: "C1", seats: 78 },
            { coachNumber: "C2", seats: 78 }
        ]
    }
];

const foodItems = [
    {
        name: "Veg Sandwich",
        description: "Fresh vegetable sandwich",
        price: 80,
        category: "Breakfast",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600",
        isAvailable: true,
        preparationTime: 10
    },
    {
        name: "Masala Dosa",
        description: "Crispy dosa served with chutney",
        price: 120,
        category: "Breakfast",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600",
        isAvailable: true,
        preparationTime: 15
    },
    {
        name: "Veg Thali",
        description: "Complete vegetarian meal",
        price: 180,
        category: "Meals",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
        isAvailable: true,
        preparationTime: 20
    },
    {
        name: "Paneer Rice",
        description: "Rice served with paneer curry",
        price: 160,
        category: "Meals",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
        isAvailable: true,
        preparationTime: 20
    },
    {
        name: "Samosa",
        description: "Crispy potato-filled snack",
        price: 40,
        category: "Snacks",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
        isAvailable: true,
        preparationTime: 8
    },
    {
        name: "Veg Cutlet",
        description: "Crispy vegetable cutlet",
        price: 60,
        category: "Snacks",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
        isAvailable: true,
        preparationTime: 10
    },
    {
        name: "Masala Chai",
        description: "Hot Indian masala tea",
        price: 30,
        category: "Beverages",
        image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600",
        isAvailable: true,
        preparationTime: 5
    },
    {
        name: "Cold Coffee",
        description: "Chilled creamy coffee",
        price: 90,
        category: "Beverages",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600",
        isAvailable: true,
        preparationTime: 7
    },
    {
        name: "Gulab Jamun",
        description: "Soft sweet dumplings in sugar syrup",
        price: 60,
        category: "Desserts",
        image: "https://images.unsplash.com/photo-1666190092159-3a4b4b8b1a9a?w=600",
        isAvailable: true,
        preparationTime: 5
    }
];

const seedDatabase = async (shouldCloseConnection = false) => {
    try {
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            if (!process.env.MONGO_URI) {
                throw new Error("MONGO_URI is missing from environment");
            }

            await mongoose.connect(process.env.MONGO_URI);
            console.log("MongoDB connected for seeding");
        }

        for (const train of trains) {
            await Train.findOneAndUpdate(
                { trainNumber: train.trainNumber },
                { $set: train },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                    runValidators: true
                }
            );

            console.log(`Train ready: ${train.trainName}`);
        }

        for (const food of foodItems) {
            await FoodItem.findOneAndUpdate(
                { name: food.name },
                { $set: food },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                    runValidators: true
                }
            );

            console.log(`Food item ready: ${food.name}`);
        }

        const hashedPassword = await bcrypt.hash(
            "pantry123",
            10
        );

        await User.findOneAndUpdate(
            { email: "pantry@railbite.com" },
            {
                $set: {
                    fullName: "RailBite Pantry Staff",
                    email: "pantry@railbite.com",
                    password: hashedPassword,
                    role: "pantry_staff"
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        console.log("\nTrains seeded successfully");
        console.log("Food items seeded successfully");
        console.log("Pantry staff account ready");
        console.log("Database seeding completed");
    } catch (error) {
        console.error("Seeding failed:", error.message);
        throw error;
    } finally {
        if (shouldCloseConnection && mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log("MongoDB connection closed");
        }
    }
};

module.exports = seedDatabase;

if (require.main === module) {
    seedDatabase(true)
        .then(() => process.exit(0))
        .catch(() => {
            process.exitCode = 1;
        });
}
