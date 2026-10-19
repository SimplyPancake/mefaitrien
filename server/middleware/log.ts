export default defineEventHandler((event) => {
  console.log("New request: " + event.method + ": " + getRequestURL(event).pathname);
});
