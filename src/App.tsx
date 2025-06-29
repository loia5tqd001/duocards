import { Route, Routes } from 'react-router-dom';
import AddCard from './screens/AddCard';
import ReviewCard from './screens/ReviewCard';
import Home from './screens/Home';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/add' element={<AddCard />} />
      <Route path='/review' element={<ReviewCard />} />
    </Routes>
  );
}

export default App;
