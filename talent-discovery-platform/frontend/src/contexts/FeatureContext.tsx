import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { featuresAPI } from '../services/api';

interface FeatureState {
  enabled: boolean;
  roles?: string[];
  config?: Record<string, any>;
}

interface FeatureContextType {
  features: Record<string, FeatureState>;
  loading: boolean;
  isEnabled: (key: string, userRole?: string) => boolean;
  getConfig: (key: string) => Record<string, any> | undefined;
  refetch: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<Record<string, FeatureState>>({});
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    try {
      const response = await featuresAPI.getEnabled();
      setFeatures(response.data.features || {});
    } catch (err) {
      console.error('Failed to fetch features:', err);
      // Default to all features enabled on error
      setFeatures({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const isEnabled = (key: string, userRole?: string): boolean => {
    const feature = features[key];

    // If feature doesn't exist in our list, default to enabled
    if (!feature) return true;

    // If globally enabled
    if (feature.enabled) return true;

    // Check role-based access
    if (userRole && feature.roles?.includes(userRole)) {
      return true;
    }

    return false;
  };

  const getConfig = (key: string): Record<string, any> | undefined => {
    return features[key]?.config;
  };

  return (
    <FeatureContext.Provider value={{
      features,
      loading,
      isEnabled,
      getConfig,
      refetch: fetchFeatures
    }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = (): FeatureContextType => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

// HOC to conditionally render based on feature flag
export const withFeature = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureKey: string,
  FallbackComponent?: React.ComponentType
) => {
  return (props: P) => {
    const { isEnabled } = useFeatures();

    if (!isEnabled(featureKey)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };
};

// Component to conditionally render children based on feature flag
export const Feature: React.FC<{
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ name, children, fallback = null }) => {
  const { isEnabled } = useFeatures();

  if (!isEnabled(name)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default FeatureContext;
