import Sidebar from "@/components/Sidebar";
import Menubar from "@/components/Menubar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LiveCard from "@/components/LiveCard";
import BatchCard from "@/components/BatchCard";
import { mockCourses } from "@/data/mockData";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, fadeIn } from "@/lib/motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen, MessageSquare, LayoutDashboard, FileQuestion } from "lucide-react";

function Study() {
  const navigate = useNavigate();
  const [topBatches] = useState(mockCourses.slice(0, 3));
  
  const handleEnroll = (id: number) => {
    console.log(`Enrolling in batch ${id}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <Menubar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 px-16">
            <div className="space-y-6">
              {/* Live Classes Section */}
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Live Classes</h2>
                    <Button 
                      variant="outline" 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => navigate('/weekly-schedule')}
                    >
                      Weekly Schedule
                    </Button>
                  </div>
                  <div className="border-t border-gray-200"></div>
                  
                  {/* Live Classes Grid */}
                  <motion.div 
                    variants={staggerContainer(0.1, 0.1)}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-4"
                  >
                    <AnimatePresence>
                      {/* Current Live Class */}
                      <motion.div
                        variants={fadeIn('right', 'spring', 0.2, 1)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LiveCard 
                          isLive={true}
                          className="border-2 border-red-500"
                        />
                      </motion.div>
                      
                      {/* Upcoming Classes */}
                      <motion.div
                        variants={fadeIn('right', 'spring', 0.4, 1)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LiveCard 
                          isLive={false}
                          className="opacity-90 hover:opacity-100"
                        />
                      </motion.div>

                      {/* Upcoming Classes */}
                      <motion.div
                        variants={fadeIn('right', 'spring', 0.4, 1)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LiveCard 
                          isLive={false}
                          className="opacity-90 hover:opacity-100"
                        />
                      </motion.div>
                      
                      <motion.div
                        variants={fadeIn('right', 'spring', 0.6, 1)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LiveCard 
                          isLive={false}
                          className="opacity-90 hover:opacity-100"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>

              {/* Continue Learning Section */}
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Continue Learning</h2>
                  <div className="w-full h-px bg-gray-200"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* My Batch Card 1 */}
                  <Card className="hover:shadow-md transition-shadow lg:h-45 lg:w-55 rounded-[5px] cursor-pointer">
                    <CardHeader className="p-4 pb-2 h-full flex flex-col">
                      <CardTitle className="text-base font-medium text-gray-900 line-clamp-2 flex items-center justify-center gap-2 text-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        My Batch
                      </CardTitle>
                      <CardContent className="p-4 pt-0 flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-600">This is Quick Access Center</p>
                      </CardContent>
                    </CardHeader>
                  </Card>

                  {/* Test Series Card 2 */}
                  <Card className="hover:shadow-md transition-shadow lg:h-45 lg:w-55 rounded-[5px] cursor-pointer">
                    <CardHeader className="p-4 pb-2 h-full flex flex-col">
                      <CardTitle className="text-base font-medium text-gray-900 line-clamp-2 flex items-center justify-center gap-2 text-center">
                        <FileQuestion className="w-5 h-5 text-purple-600" />
                        Test Series
                      </CardTitle>
                      <CardContent className="p-4 pt-0 flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-600">Practice with our test series</p>
                      </CardContent>
                    </CardHeader>
                  </Card>

                  {/* Doubt Card 3 */}
                  <Card className="hover:shadow-md transition-shadow lg:h-45 lg:w-55 rounded-[5px] cursor-pointer">
                    <CardHeader className="p-4 pb-2 h-full flex flex-col">
                      <CardTitle className="text-base font-medium text-gray-900 line-clamp-2 flex items-center justify-center gap-2 text-center">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Doubt
                      </CardTitle>
                      <CardContent className="p-4 pt-0 flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-600">This is Quick Access Center</p>
                      </CardContent>
                    </CardHeader>
                  </Card>

                  {/* Dashboard Card 4 */}
                  <Card className="hover:shadow-md transition-shadow lg:h-45 lg:w-55 rounded-[5px] cursor-pointer">
                    <CardHeader className="p-4 pb-2 h-full flex flex-col">
                      <CardTitle className="text-base font-medium text-gray-900 line-clamp-2 flex items-center justify-center gap-2 text-center">
                        <LayoutDashboard className="w-5 h-5 text-orange-500" />
                        Dashboard
                      </CardTitle>
                      <CardContent className="p-4 pt-0 flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-600">This is Quick Access Center</p>
                      </CardContent>
                    </CardHeader>
                  </Card>

                </div>
              </motion.div>

              {/* Top Batch Section */}
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="bg-white p-6 rounded-lg shadow"
              >
                <motion.div className="mb-6">
                  <motion.div 
                    variants={fadeIn('up', 'tween', 0.2, 1)}
                    className="flex justify-between items-center mb-4"
                  >
                    <h2 className="text-2xl font-bold text-gray-800">Top Batches</h2>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate('/batches')}
                      >
                        View All
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    variants={fadeIn('up', 'tween', 0.3, 1)}
                    className="border-t border-gray-200"
                  />
                </motion.div>
                
                <motion.div 
                  variants={staggerContainer(0.1, 0.2)}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence>
                    {topBatches.map((batch, index) => (
                      <motion.div
                        key={batch.id}
                        variants={fadeIn('up', 'spring', index * 0.2, 1)}
                        whileHover={{ y: -5, transition: { duration: 0.3 } }}
                        whileTap={{ scale: 0.98 }}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-20% 0px -20% 0px" }}
                      >
                        <BatchCard
                          {...batch}
                          onEnroll={handleEnroll}
                          hideExploreButton={false}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Study;
