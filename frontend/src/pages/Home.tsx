import { Routes, Route, useLocation } from "react-router-dom";
import PostDetail from "./PostDetail";
import PostCard from "@/components/feed/PostCard";

const Home = () => {
  const location = useLocation();
  const background = location.state?.background;

  return (
    <>
      {/* MAIN ROUTES */}
      <Routes location={background || location}>
        <Route
          path="/"
          element={
            <div className="space-y-8">
              {[1, 2, 3].map((id) => (
                <PostCard key={id} postId={id} />
              ))}
            </div>
          }
        />
      </Routes>

      {/* MODAL ROUTES */}
      {background && (
        <Routes>
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      )}
    </>
  );
};

export default Home;
