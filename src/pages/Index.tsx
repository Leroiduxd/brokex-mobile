import { MarketsPage } from './MarketsPage';
import { BottomNavigation } from '@/components/BottomNavigation';

const Index = () => {
  return (
    <div className="min-h-screen pb-16">
      <MarketsPage />
      <BottomNavigation />
    </div>
  );
};

export default Index;