// src/pages/About.tsx
import React from 'react';
import {
  SparklesIcon,
  MusicalNoteIcon,
  QueueListIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  ServerIcon,
  CircleStackIcon,
  HeartIcon,
  UserGroupIcon,
  AcademicCapIcon,
  EnvelopeIcon
} from '@heroicons/react/24/solid';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white/5 p-6 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 text-center">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>
);

const TechPill = ({ icon, name }: { icon: React.ReactNode, name: string }) => (
  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
    {icon}
    <span className="text-white font-medium">{name}</span>
  </div>
);

const About: React.FC = () => {
  const developers = ["KETAN VATS"];
  const contributors = ["HIMANSHU RAI", "BHUSHAN SAH"];
  const facultyName = ["Dr. KRISHNA NAND MISHRA"];
  const contactEmail = "ketanvats281@gmail.com";

  return (
    <div className="animate-fadeInScale space-y-16 p-6 sm:p-8 rounded-2xl bg-black/20 backdrop-blur-lg border border-white/10 shadow-lg shadow-black/30">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-5xl sm:text-6xl font-serif italic font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text mb-4"
        >
          Moodify
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Your personal music discovery platform, powered by AI. Dive into a seamless listening experience with dynamic visuals and endless tracks.
        </p>
      </div>

      {/* Key Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<SparklesIcon className="h-10 w-10 text-purple-400" />}
            title="AI Playlists"
            description="Describe any mood, genre, or activity to instantly generate a personalized playlist."
          />
          <FeatureCard
            icon={<MusicalNoteIcon className="h-10 w-10 text-blue-400" />}
            title="Trending Music"
            description="Discover the hottest tracks from around the world with region-specific trending charts."
          />
          <FeatureCard
            icon={<QueueListIcon className="h-10 w-10 text-green-400" />}
            title="Synced Lyrics"
            description="Sing along with perfectly timed lyrics that scroll as the music plays."
          />
          <FeatureCard
            icon={<PaintBrushIcon className="h-10 w-10 text-pink-400" />}
            title="Dynamic UI"
            description="Experience an immersive interface where the background colors adapt to the album art."
          />
        </div>
      </section>

      {/* The Team Section */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-8">The Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Project Members Card */}
          <div className="bg-white/5 p-6 rounded-2xl text-center">
            <div className="flex justify-center mb-4"><UserGroupIcon className="h-10 w-10 text-sky-400" /></div>
            <h3 className="text-xl font-semibold text-white mb-4">Project Members</h3>
            <ul className="space-y-2 text-gray-300">
              {[...developers, ...contributors].map((name, index) => <li key={index}>{name}</li>)}
            </ul>
          </div>
          {/* Faculty Guide Card */}
          <div className="bg-white/5 p-6 rounded-2xl text-center">
            <div className="flex justify-center mb-4"><AcademicCapIcon className="h-10 w-10 text-amber-400" /></div>
            <h3 className="text-xl font-semibold text-white mb-4">Faculty Guide</h3>
            <ul className="space-y-2 text-gray-300">
              {facultyName.map((name, index) => <li key={index}>{name}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section>
        <h2 className="text-3xl font-bold text-white text-center mb-8">Powered By</h2>
        <div className="flex flex-wrap justify-center items-center gap-4">
          <TechPill icon={<CodeBracketIcon className="h-5 w-5 text-sky-400" />} name="React & Vite" />
          <TechPill icon={<CodeBracketIcon className="h-5 w-5 text-blue-400" />} name="TypeScript" />
          <TechPill icon={<PaintBrushIcon className="h-5 w-5 text-cyan-400" />} name="Tailwind CSS" />
          <TechPill icon={<ServerIcon className="h-5 w-5 text-green-400" />} name="Node.js & Express" />
          <TechPill icon={<CircleStackIcon className="h-5 w-5 text-lime-400" />} name="MongoDB" />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 space-y-4">
        <a href={`mailto:${contactEmail}?subject=Regarding Moodify App`} className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-600 transition-colors text-lg shadow-md">
          <EnvelopeIcon className="h-6 w-6" />
          Contact Us
        </a>
        <p className="flex items-center justify-center gap-2 pt-4">
          Made with <HeartIcon className="h-5 w-5 text-red-500" /> by the Moodify Team
        </p>
      </footer>
    </div>
  );
};

export default About;