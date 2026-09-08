import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import WelcomePage from "./pages/WelcomePage"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import InterviewPage from "./pages/InterviewPage"
import InterviewStartPage from "./pages/InterviewStartPage"
import ResultPage from "./pages/ResultPage"
import QuestionAndAnswer from "./pages/QuestionAndAnswer"
import Feedback from "./pages/Feedback"
import SessionsPage from "./pages/SessionsPage"








function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>

        <Route
          path= "/"
          element= {< Navigate to="/login" replace />}
        />

        <Route
          path= "/sessions"
          element= {<SessionsPage />}
        />

        <Route
          path= "/questions/:sessionId"
          element= {<QuestionAndAnswer />}
        />

        <Route
          path= "/feedback/:sessionId"
          element= {<Feedback />}
        />

        <Route
          path= "/result/:sessionId"
          element= {<ResultPage />}
        />

        <Route
          path= "/interview/start/:sessionId"
          element= {<InterviewStartPage />}
        />

        <Route
          path="/interview"
          element= {<InterviewPage />}
        />

        <Route
          path="/welcome"
          element= {<WelcomePage/>}
        />

        <Route
          path="/login"
          element= {<Login/>}
        />

        <Route
          path="/signup"
          element= {<Signup/>}
        />
      </Routes>
    </BrowserRouter> 
    </>
  )
}

export default App
