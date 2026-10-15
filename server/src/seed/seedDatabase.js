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
    }
];

const foodItems = [
    {
        name: "Veg Sandwich",
        description: "Fresh vegetable sandwich",
        price: 80,
        category: "Breakfast",
        image: "",
        isAvailable: true,
        preparationTime: 10
    },
    {
        name: "Masala Dosa",
        description: "Crispy dosa served with chutney",
        price: 120,
        category: "Breakfast",
        image: "",
        isAvailable: true,
        preparationTime: 15
    },
    {
        name: "Veg Thali",
        description: "Complete vegetarian meal",
        price: 180,
        category: "Meals",
        image: "",
        isAvailable: true,
        preparationTime: 20
    },
    {
        name: "Paneer Rice",
        description: "Rice served with paneer curry",
        price: 160,
        category: "Meals",
        image: "",
        isAvailable: true,
        preparationTime: 20
    },
    {
        name: "Samosa",
        description: "Crispy potato-filled snack",
        price: 40,
        category: "Snacks",
        image: "",
        isAvailable: true,
        preparationTime: 8
    },
    {
        name: "Veg Cutlet",
        description: "Crispy vegetable cutlet",
        price: 60,
        category: "Snacks",
        image: "",
        isAvailable: true,
        preparationTime: 10
    },
    {
        name: "Masala Chai",
        description: "Hot Indian masala tea",
        price: 30,
        category: "Beverages",
        image: "",
        isAvailable: true,
        preparationTime: 5
    },
    {
        name: "Cold Coffee",
        description: "Chilled creamy coffee",
        price: 90,
        category: "Beverages",
        image: "",
        isAvailable: true,
        preparationTime: 7
    },
    {
        name: "Gulab Jamun",
        description: "Soft sweet dumplings in sugar syrup",
        price: 60,
        category: "Desserts",
        image: "",
        isAvailable: true,
        preparationTime: 5
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        // Seed trains without deleting existing documents
        for (const train of trains) {
            await Train.findOneAndUpdate(
                {
                    trainNumber: train.trainNumber
                },
                train,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        }

        // Seed food items without deleting existing documents
        for (const food of foodItems) {
            await FoodItem.findOneAndUpdate(
                {
                    name: food.name
                },
                food,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        }

        // Create/update pantry staff account
        const hashedPassword = await bcrypt.hash(
            "pantry123",
            10
        );

        await User.findOneAndUpdate(
            {
                email: "pantry@railbite.com"
            },
            {
                fullName: "RailBite Pantry Staff",
                email: "pantry@railbite.com",
                password: hashedPassword,
                role: "pantry_staff"
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log("Trains seeded successfully");
        console.log("Food items seeded successfully");
        console.log("Pantry staff account ready");
        console.log("Database seeding completed");

        await mongoose.connection.close();

        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Seeding failed:", error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

seedDatabase();