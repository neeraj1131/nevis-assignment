import type { FastifyError, FastifyInstance, FastifyReply } from 'fastify';

const PROBLEM_JSON = 'application/problem+json';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
}

/** Sends an RFC 9457 problem-details JSON body. Never include stack traces here. */
export function sendProblem(reply: FastifyReply, problem: ProblemDetails): void {
  reply.status(problem.status).header('content-type', PROBLEM_JSON).send(problem);
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    sendProblem(reply, {
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: `Route ${request.method} ${request.url} not found`,
      instance: request.url,
    });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status =
      typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;
    const isServerError = status >= 500;

    // Stack traces stay in the logs; the response body only ever gets a safe summary.
    request.log.error({ err: error, statusCode: status }, 'request error');

    sendProblem(reply, {
      type: 'about:blank',
      title: isServerError
        ? 'Internal Server Error'
        : error.name === ''
          ? 'Bad Request'
          : error.name,
      status,
      detail: isServerError ? 'An unexpected error occurred' : error.message,
      instance: request.url,
    });
  });
}
