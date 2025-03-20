import React from "react";
import { Modal, Form, Input, DatePicker, Select, Button } from "antd";
import moment from "moment";

const { Option } = Select;

function EditTransactionModal({
  isVisible,
  handleCancel,
  transactionData,
  onFinish,
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (transactionData) {
      form.setFieldsValue({
        name: transactionData.name,
        amount: transactionData.amount,
        date: moment(transactionData.date, "YYYY-MM-DD"),
        tag: transactionData.tag,
      });
    }
  }, [transactionData, form]);

  return (
    <Modal
      title="Edit Transaction"
      visible={isVisible}
      onCancel={handleCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          // Pass the updated values along with the transaction id
          onFinish({ ...values, id: transactionData.id });
          form.resetFields();
        }}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please input the transaction name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true, message: "Please input the amount!" }]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: "Please select the date!" }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          label="Tag"
          name="tag"
          rules={[{ required: true, message: "Please select a tag!" }]}
        >
          <Select>
            {/* List your tag options here */}
            <Option value="food">Food</Option>
            <Option value="education">Education</Option>
            <Option value="office">Office</Option>
            <Option value="salary">Salary</Option>
            <Option value="freelance">Freelance</Option>
            <Option value="investment">Investment</Option>
            <Option value="miscellaneous">Miscellaneous</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditTransactionModal;
