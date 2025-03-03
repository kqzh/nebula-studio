import { Breadcrumb, Button, Icon, Input, message, Modal, Select } from 'antd';
import Form, { FormComponentProps } from 'antd/lib/form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { match, RouteComponentProps, withRouter } from 'react-router-dom';

import { Instruction, Modal as ModalComponent } from '#app/components';
import GQLCodeMirror from '#app/components/GQLCodeMirror';
import { nameRulesFn } from '#app/config/rules';
import { IDispatch, IRootState } from '#app/store';
import { POSITIVE_INTEGER_REGEX } from '#app/utils/constant';
import { getIndexCreateGQL } from '#app/utils/gql';
import { trackEvent, trackPageView } from '#app/utils/stat';

import './Create.less';
import DraggableTags from './DraggableTags';
const confirm = Modal.confirm;

const Option = Select.Option;
type IndexType = 'TAG' | 'EDGE';

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncCreateIndex,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetTags: dispatch.nebula.asyncGetTags,
  asyncGetEdges: dispatch.nebula.asyncGetEdges,
  asyncGetEdgeInfo: dispatch.nebula.asyncGetEdgeInfo,
  asyncGetTagInfo: dispatch.nebula.asyncGetTagInfo,
  asyncCreateIndex: dispatch.nebula.asyncCreateIndex,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps,
    RouteComponentProps {
  match: match<{ space: string }>;
}
interface IType {
  ID: string;
  Name: string;
}

interface IField {
  Field: string;
  Type: string;
}

interface IState {
  typeList: IType[];
  fieldList: IField[];
  selectedField: string;
  selectedFieldType: string;
  indexLength: string;
}

const itemLayout = {
  labelCol: {
    span: 3,
  },
  wrapperCol: {
    span: 6,
  },
};
const fieldsLayout = {
  labelCol: {
    span: 3,
  },
  wrapperCol: {
    span: 12,
  },
};

class CreateIndex extends React.Component<IProps, IState> {
  modalHandler;
  constructor(props: IProps) {
    super(props);
    this.state = {
      typeList: [],
      fieldList: [],
      selectedField: '',
      selectedFieldType: '',
      indexLength: '',
    };
  }

  componentDidMount() {
    trackPageView('/schema/config/index/create');
    this.getAssociatedList('TAG');
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.space !== this.props.match.params.space) {
      this.getAssociatedList();
    }
  }

  getAssociatedList = async (type?: IndexType) => {
    const { getFieldValue, setFieldsValue } = this.props.form;
    const associatedType = type ? type : getFieldValue('type');
    const res =
      associatedType === 'TAG'
        ? await this.props.asyncGetTags()
        : await this.props.asyncGetEdges();
    if (res.code === 0) {
      this.setState({
        typeList: res.data,
      });
      setFieldsValue({
        associate: '',
        fields: [],
      });
    }
  };

  getFieldList = async value => {
    const { getFieldValue, setFieldsValue } = this.props.form;
    const type = getFieldValue('type');
    const res =
      type === 'TAG'
        ? await this.props.asyncGetTagInfo(value)
        : await this.props.asyncGetEdgeInfo(value);
    if (res.code === 0) {
      this.setState({
        fieldList: res.data.tables,
      });
      setFieldsValue({
        fields: [],
      });
    }
  };

  updateFields = (data: string[]) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({
      fields: data,
    });
  };

  removeField = (field: string) => {
    const { setFieldsValue, getFieldValue } = this.props.form;
    const fields = getFieldValue('fields');
    setFieldsValue({
      fields: fields.filter(i => i !== field),
    });
  };

  handleOpenModal = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };
  handleClose = () => {
    if (this.modalHandler) {
      this.modalHandler.hide();
    }
  };

  handleSelectField = (value: string) => {
    const { fieldList } = this.state;
    const selectedFieldType = fieldList.filter(
      field => field.Field === value,
    )[0].Type;
    this.setState({
      selectedField: value,
      selectedFieldType,
      indexLength: selectedFieldType.startsWith('fixed_string')
        ? selectedFieldType.replace(/[fixed_string(|)]/g, '')
        : '',
    });
  };

  addIndexLength = e => {
    this.setState({
      indexLength: e.target.value,
    });
  };

  handleCreate = () => {
    const { getFieldsValue } = this.props.form;
    const { match } = this.props;
    const {
      params: { space },
    } = match;
    this.props.form.validateFields(async err => {
      if (!err) {
        const { name, type, associate, fields, comment } = getFieldsValue();
        const res = await this.props.asyncCreateIndex({
          name,
          type,
          associate,
          fields,
          comment,
        });
        if (res.code === 0) {
          message.success(intl.get('schema.createSuccess'));
          this.props.history.push(`/space/${space}/index/list`, {
            indexType: type,
          });
        } else {
          message.warning(res.message);
        }
      }
    });
  };

  handleAddField = () => {
    const { selectedField, indexLength, selectedFieldType } = this.state;
    const { setFieldsValue, getFieldValue } = this.props.form;
    if (
      selectedFieldType === 'string' &&
      !indexLength.match(POSITIVE_INTEGER_REGEX)
    ) {
      return message.warning(intl.get('schema.indexedLengthRequired'));
    }
    const newField =
      selectedFieldType === 'string'
        ? selectedField + `(${indexLength})`
        : selectedField;
    const fields = getFieldValue('fields');
    setFieldsValue({
      fields: [...fields, newField],
    });
    this.setState({
      selectedField: '',
      indexLength: '',
      selectedFieldType: '',
    });
    this.handleClose();
  };

  goBack = e => {
    e.preventDefault();
    const { match, history } = this.props;
    const {
      params: { space },
    } = match;
    confirm({
      title: intl.get('schema.leavePage'),
      content: intl.get('schema.leavePagePrompt'),
      okText: intl.get('common.confirm'),
      cancelText: intl.get('common.cancel'),
      onOk() {
        history.push(`/space/${space}/index/list`);
        trackEvent('navigation', 'view_index_list', 'from_index_create');
      },
    });
  };

  render() {
    const { loading } = this.props;
    const { getFieldValue } = this.props.form;
    const fields = getFieldValue('fields') || [];
    const name = getFieldValue('name') || '';
    const type = getFieldValue('type');
    const associate = getFieldValue('associate') || '';
    const comment = getFieldValue('comment') || '';
    const {
      typeList,
      fieldList,
      selectedField,
      selectedFieldType,
      indexLength,
    } = this.state;
    const filterList = fieldList.filter(
      item => !fields.some(field => field.startsWith(item.Field)),
    );
    const currentGQL = getIndexCreateGQL({
      type,
      name,
      associate,
      fields,
      comment,
    });
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="space-config-component nebula-index-create">
        <header>
          <Breadcrumb className="breadcrumb-bold">
            <Breadcrumb.Item>{intl.get('common.index')}</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="#" onClick={this.goBack}>
                {intl.get('common.list')}
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{intl.get('common.create')}</Breadcrumb.Item>
          </Breadcrumb>
          <Button onClick={this.goBack}>
            <Icon type="left" />
            {intl.get('schema.backToIndexList')}
          </Button>
        </header>
        <div className="index-form">
          <Form {...itemLayout}>
            <Form.Item label={intl.get('schema.indexType')}>
              {getFieldDecorator('type', {
                rules: [
                  {
                    required: true,
                  },
                ],
                initialValue: 'TAG',
              })(
                <Select onChange={this.getAssociatedList}>
                  <Option value="TAG">Tag</Option>
                  <Option value="EDGE">Edge Type</Option>
                </Select>,
              )}
            </Form.Item>
            <Form.Item label={intl.get('common.name')}>
              {getFieldDecorator('associate', {
                rules: [
                  {
                    required: true,
                  },
                ],
              })(
                <Select onChange={this.getFieldList}>
                  {typeList.map((item, index) => (
                    <Option value={item.Name} key={`${index}_${item.Name}`}>
                      {item.Name}
                    </Option>
                  ))}
                </Select>,
              )}
            </Form.Item>
            <Form.Item label={intl.get('schema.indexName')}>
              {getFieldDecorator('name', {
                rules: nameRulesFn(intl),
              })(<Input />)}
            </Form.Item>
            <Form.Item
              className="item-field"
              label={
                <>
                  {intl.get('schema.indexFields')}
                  <span className="tip-draggable">
                    {intl.get('schema.dragSorting')}
                  </span>
                </>
              }
              {...fieldsLayout}
            >
              {getFieldDecorator('fields', {
                initialValue: [],
              })(
                <div className="tags">
                  <DraggableTags
                    data={fields}
                    updateData={this.updateFields}
                    removeData={this.removeField}
                  />
                  <Button
                    type="link"
                    className="btn-field-add"
                    onClick={this.handleOpenModal}
                  >
                    {intl.get('common.add')}
                  </Button>
                </div>,
              )}
            </Form.Item>
            <Form.Item label={intl.get('common.comment')}>
              {getFieldDecorator('comment')(<Input />)}
            </Form.Item>
          </Form>
          <GQLCodeMirror currentGQL={currentGQL} />
          <div className="btns">
            <Button
              type="primary"
              loading={!!loading}
              onClick={this.handleCreate}
            >
              <Icon type="plus" />
              {intl.get('common.create')}
            </Button>
          </div>
          <ModalComponent
            className="modal-field-add"
            handlerRef={handler => (this.modalHandler = handler)}
            maskClosable={false}
            closable={false}
            footer={
              <>
                <Button
                  key="confirm"
                  type="primary"
                  disabled={selectedField === ''}
                  onClick={this.handleAddField}
                >
                  {intl.get('explore.confirm')}
                </Button>
                <Button onClick={this.handleClose}>
                  {intl.get('common.cancel')}
                </Button>
              </>
            }
          >
            <div className="modal-item">
              <span>{intl.get('schema.selectFields')}:</span>
              <Select
                onChange={this.handleSelectField}
                className="select-field"
              >
                {filterList.map(item => (
                  <Option value={item.Field} key={item.Field}>
                    {item.Field}
                  </Option>
                ))}
              </Select>
            </div>
            {/* string & fixed string should supply length parameter */}
            {selectedFieldType && selectedFieldType.includes('string') && (
              <div className="modal-item">
                <span>{intl.get('schema.indexedLength')}:</span>
                <Input
                  disabled={selectedFieldType.startsWith('fixed_string')}
                  placeholder={indexLength}
                  className="input-index-length"
                  onChange={this.addIndexLength}
                />
                <Instruction
                  description={intl.get('schema.indexedLengthDescription')}
                />
              </div>
            )}
          </ModalComponent>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(mapState, mapDispatch)(Form.create<IProps>()(CreateIndex)),
);
