// src/pages/AboutPage.tsx
import React from 'react';
import { EnvelopeIcon, CodeBracketIcon } from '@heroicons/react/24/solid';

const AboutPage: React.FC = () => {
  const developers = ["KETAN VATS"]; // Your Name
  const contributors = ["HIMANSHU RAI", "BHUSHAN SAH"];
  const faculityName = ["Dr. KRISHNA NAND MISHRA"];
  const contactEmail = "ketanvats281@gmail.com"; // Your contact email

  return (
    <div className="container mx-auto p-4 sm:p-8 text-white text-center" data-aos="fade-up">
      <h2 className="text-4xl font-bold mb-8 font-roboto bg-gradient-to-r from-blue-400 to-black-500 text-transparent bg-clip-text">About Moodify</h2>
      
      <div className="max-w-2xl mx-auto bg-white/10 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-lg">
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2"><CodeBracketIcon className="h-7 w-7" />Project Members</h3>
          <ul className="space-y-2">
            {[...developers, ...contributors].map((name, index) => (
              <li key={index} className="flex items-center justify-center gap-3 text-xl">

                <span>{name}</span>
              </li>
            ))}
          </ul> 
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Faculty Guide</h3>
          <ul className="space-y-2">
            {faculityName.map((name, index) => (
              <li key={index} className="text-lg">{name}</li>
            ))}
          </ul>
        </div>

        <a href={`mailto:${contactEmail}?subject=Regarding Moodify App`} className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-600 transition-colors text-lg shadow-md">
          <EnvelopeIcon className="h-6 w-6" />
          Contact Us
        </a>
        <p className="text-sm text-gray-400 mt-4">Facing an issue or have a suggestion? Let us know!</p>
      </div>
    </div>
  );
};

export default AboutPage;
