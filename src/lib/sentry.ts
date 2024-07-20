import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const env = process.env.NODE_ENV ?? "development";

Sentry.init({
  environment: env,
  dsn: "https://ae1d083833efec8ceafa8688262e2e8c@o4506080010305536.ingest.sentry.io/4506080060309505",
  integrations: [nodeProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

export const transaction = Sentry.startInactiveSpan({
  name: "Transaction",
});

export default Sentry;
