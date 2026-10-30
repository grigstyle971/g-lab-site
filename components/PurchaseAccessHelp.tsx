export function PurchaseAccessHelp({ ru }: { ru: boolean }) {
  return (
    <p className="account-note">
      {ru
        ? "Уже оплатили, но доступ не появился? Проверьте почту в чеке Gumroad и повторите попытку через минуту. Если прошло больше 10 минут, напишите с почты покупки в "
        : "Paid but still cannot access the course? Check the email on your Gumroad receipt and try again in a minute. If more than 10 minutes have passed, email "}
      <a
        href="mailto:glab.tech.support@gmail.com"
        style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}
      >
        {ru ? "поддержку" : "support"}
      </a>
      {ru
        ? " и укажите номер заказа Gumroad. Повторно платить не нужно."
        : " from your purchase email and include your Gumroad order ID. You do not need to pay again."}
    </p>
  );
}
