import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";


interface SidebarProp{
  sessionId: string;
}

const Sidebar = ({sessionId}: SidebarProp) => {

 
  const navigate= useNavigate();

  const { user }= useAuth();

  const handleStartAgain= async ()=>{
    navigate("/welcome");
  }

  const handleLogout= async ()=>{
    await logout();
    navigate('/');
  }


  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-500 to-purple-600 text-white shadow-lg flex flex-col items-center py-8 space-y-6 rounded-r-xl">
      <div className="text-xl font-bold">{user?.email.split("@")[0]}</div>
      <nav className="flex flex-col w-full px-4 space-y-4">
        <button 
          className="py-2 px-4 bg-white text-indigo-600 font-medium rounded-lg shadow hover:bg-indigo-100 transition cursor-pointer"
          onClick={()=> navigate(`/questions/${sessionId}`)}
          >
          ALL Q&As
        </button>
        <button 
          className="py-2 px-4 bg-white text-indigo-600 font-medium rounded-lg shadow hover:bg-indigo-100 transition cursor-pointer"
          onClick={()=> navigate(`/feedback/${sessionId}`)}
          >
          Feedback
        </button>
        <button 
          className="py-2 px-4 bg-white text-indigo-600 font-medium rounded-lg shadow hover:bg-indigo-100 transition cursor-pointer"
          onClick={()=> navigate(`/sessions`)}
          >
          Your Sessions
        </button>
        <button 
          className="py-2 px-4 bg-white text-indigo-600 font-medium rounded-lg shadow hover:bg-indigo-100 transition cursor-pointer"
          onClick= {handleStartAgain}
          >
          Back to Welcome
        </button>
        <button 
          className="py-2 px-4 bg-white text-indigo-600 font-medium rounded-lg shadow hover:bg-indigo-100 transition cursor-pointer"
          onClick= {handleLogout}
          >
            Logout
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
