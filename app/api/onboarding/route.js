import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function POST(req) {
  try {
    const { userId, name, topic, level } = await req.json();

    // Validate input
    if (!userId || !name || !topic || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    user.name = name;
    user.topic = topic;
    user.level = level;
    user.isOnboarded = true;
    await user.save();

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      topic: user.topic,
      level: user.level,
      isOnboarded: user.isOnboarded,
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 