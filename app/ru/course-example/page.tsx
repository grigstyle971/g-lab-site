import CourseExampleRoute, { metadata as originalMetadata } from "../../course-example/ExampleRoute";

export const metadata = {
  ...originalMetadata,
  title: "Разбор готового сайта",
  description:
    "Сравните слабый черновик с готовым вымышленным сайтом, затем проверьте собственный проект по практическому списку.",
};

export default CourseExampleRoute;
